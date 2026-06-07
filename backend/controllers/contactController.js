const { sendContactEmail } = require('../services/contactEmailService');

const submitContactMessage = async (req, res) => {
  try {
    const result = await sendContactEmail(req.body);
    return res.status(202).json({
      message: 'Contact message sent',
      reference: result.reference,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to send contact message',
      error: error.message,
    });
  }
};

module.exports = {
  submitContactMessage,
};
