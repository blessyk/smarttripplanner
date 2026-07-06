const Contact = require('../models/Contact');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all contact messages
 * @route   GET /api/contacts
 * @access  Private/Admin
 */
const getAllContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Contacts retrieved successfully',
      data: {
        contacts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a contact message
 * @route   POST /api/contacts
 * @access  Public
 */
const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    const contact = await Contact.create({
      name,
      email,
      phone,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: {
        contact,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a contact message
 * @route   DELETE /api/contacts/:id
 * @access  Private/Admin
 */
const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return next(new ApiError(404, `Contact message not found with ID ${req.params.id}`));
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllContacts,
  createContact,
  deleteContact,
};
