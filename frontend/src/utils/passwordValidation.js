export const passwordRequirements = [
  { key: 'minLength', label: 'Minimum 8 characters', test: (value) => value.length >= 8 },
  { key: 'uppercase', label: 'Uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', label: 'Lowercase letter', test: (value) => /[a-z]/.test(value) },
  { key: 'number', label: 'Number', test: (value) => /\d/.test(value) },
  { key: 'special', label: 'Special character', test: (value) => /[!@#$%^&*]/.test(value) },
];

export const getPasswordChecks = (password = '') =>
  passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));

export const isStrongPassword = (password = '') =>
  getPasswordChecks(password).every((requirement) => requirement.met);

export const getPasswordStrength = (password = '') => {
  const metCount = getPasswordChecks(password).filter((requirement) => requirement.met).length;
  if (metCount <= 2) return 'Weak';
  if (metCount <= 4) return 'Medium';
  return 'Strong';
};
