const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('./prisma');
const { store, createId, seedAdmin, getNextCustomerId } = require('../data/memoryStore');
const { getNextCustomerId: getNextDbCustomerId } = require('../utils/customerId');
const { withId } = require('../utils/dbFormat');
const devLog = require('../utils/devLog');

const getGoogleCallbackUrl = () =>
  process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;

const getProfileEmail = (profile) => profile.emails?.find((entry) => entry.value)?.value?.toLowerCase();
const getProfileAvatar = (profile) => profile.photos?.find((entry) => entry.value)?.value || '';
const getProfileName = (profile) => profile.displayName || [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') || 'Atelier Customer';

const findOrCreateGoogleUser = async (profile) => {
  const email = getProfileEmail(profile);
  const googleId = profile.id;

  devLog('[auth][google] profile received', {
    googleId,
    email,
    displayName: profile.displayName
  });

  if (!email || !googleId) {
    const error = new Error('Google account must include an email address');
    error.code = 'OAUTH_PROFILE_INCOMPLETE';
    throw error;
  }

  const name = getProfileName(profile);
  const avatar = getProfileAvatar(profile);

  if (global.useMemoryStore) {
    await seedAdmin();
    const googleUser = store.users.find((user) => user.googleId === googleId);
    if (googleUser) {
      devLog('[auth][google] matched existing memory user by googleId', { userId: googleUser._id, email: googleUser.email });
      return googleUser;
    }

    const emailUser = store.users.find((user) => String(user.email).toLowerCase() === email);
    if (emailUser) {
      devLog('[auth][google] linking memory user to google account', { userId: emailUser._id, email: emailUser.email });
      emailUser.googleId = googleId;
      emailUser.avatar = avatar;
      emailUser.provider = emailUser.provider || 'local';
      emailUser.updatedAt = new Date();
      return emailUser;
    }

    const user = {
      _id: createId(),
      customerId: getNextCustomerId('CUS'),
      name,
      email,
      password: null,
      provider: 'google',
      googleId,
      avatar,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    store.users.push(user);
    devLog('[auth][google] created memory user', { userId: user._id, email: user.email });
    return user;
  }

  const googleUser = await prisma.user.findUnique({ where: { googleId } });
  if (googleUser) {
    if (googleUser.email !== email) {
      const emailOwner = await prisma.user.findUnique({ where: { email } });
      if (emailOwner && emailOwner.id !== googleUser.id) {
        const error = new Error('Google account email conflicts with another Atelier account');
        error.code = 'ACCOUNT_CONFLICT';
        throw error;
      }
    }

    const updated = await prisma.user.update({
      where: { id: googleUser.id },
      data: { name: googleUser.name || name, email, avatar }
    });
    devLog('[auth][google] matched existing db user by googleId', { userId: updated.id, email: updated.email });
    return withId(updated);
  }

  const emailUser = await prisma.user.findUnique({ where: { email } });
  if (emailUser) {
    devLog('[auth][google] linking db user to google account', { userId: emailUser.id, email: emailUser.email });
    const updated = await prisma.user.update({
      where: { id: emailUser.id },
      data: {
        googleId,
        avatar,
        provider: emailUser.provider || 'local'
      }
    });
    return withId(updated);
  }

  const customerId = await getNextDbCustomerId(prisma, 'CUS');
  devLog('[auth][google] creating new db user', { email, customerId });
  const user = await prisma.user.create({
    data: {
      customerId,
      name,
      email,
      password: null,
      provider: 'google',
      googleId,
      avatar,
      role: 'user'
    }
  });

  return withId(user);
};

const configurePassport = () => {
  const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);

  devLog('[auth][google] passport bootstrap', {
    hasClientId,
    hasClientSecret,
    callbackURL: getGoogleCallbackUrl()
  });

  if (!hasClientId || !hasClientSecret) {
    devLog('[auth][google] passport strategy not initialized because Google credentials are missing');
    return passport;
  }

  const callbackURL = getGoogleCallbackUrl();

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          devLog('Google profile:', profile);
          devLog('[auth][google] strategy verify callback entered', {
            profileId: profile?.id,
            email: getProfileEmail(profile)
          });
          const user = await findOrCreateGoogleUser(profile);
          devLog('Google callback user:', user);
          devLog('[auth][google] strategy verify callback succeeded', {
            userId: user?._id || user?.id,
            email: user?.email
          });
          done(null, user);
        } catch (error) {
          console.error('[auth][google] strategy verify callback failed', error);
          done(error);
        }
      }
    )
  );

  devLog('[auth][google] passport strategy initialized');

  return passport;
};

module.exports = { configurePassport, findOrCreateGoogleUser };
