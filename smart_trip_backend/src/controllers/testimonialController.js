const Testimonial = require('../models/Testimonial');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all testimonials
 * @route   GET /api/testimonials
 * @access  Public
 */
const getAllTestimonials = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const startIndex = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { text: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Testimonial.countDocuments(query);
    const testimonials = await Testimonial.find(query)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      message: 'Testimonials retrieved successfully',
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        testimonials,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a testimonial
 * @route   POST /api/testimonials
 * @access  Private/Admin
 */
const createTestimonial = async (req, res, next) => {
  try {
    const { name, location, image, text, rating } = req.body;

    const testimonial = await Testimonial.create({
      name,
      location,
      image,
      text,
      rating,
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: {
        testimonial,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a testimonial
 * @route   DELETE /api/testimonials/:id
 * @access  Private/Admin
 */
const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return next(new ApiError(404, `Testimonial not found with ID ${req.params.id}`));
    }

    await Testimonial.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTestimonials,
  createTestimonial,
  deleteTestimonial,
};
