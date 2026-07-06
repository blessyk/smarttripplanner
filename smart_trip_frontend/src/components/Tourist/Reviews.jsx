import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Input from "../Input";

const schema = yup.object().shape({
    destination: yup.string().required("Destination is required"),
    rating: yup
        .number()
        .typeError("Rating must be a number")
        .min(1, "Minimum rating is 1")
        .max(5, "Maximum rating is 5")
        .required("Rating is required"),
    review: yup
        .string()
        .min(10, "Review must be at least 10 characters")
        .required("Review is required"),
});

const Reviews = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = (data) => {
        console.log("Review Data:", data);

        alert("Review submitted successfully!");
        reset();
    };

    return (
        <div className="p-6">
            <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">

                <h2 className="text-2xl font-bold mb-4 text-[#0A3D62]">
                    Add Your Review
                </h2>

                <form onSubmit={handleSubmit(onSubmit)}>

                    {/* Destination */}
                    <Input
                        label="Destination"
                        placeholder="Enter destination (e.g., Goa)"
                        {...register("destination")}
                        error={errors.destination?.message}
                    />

                    {/* Rating */}
                    <Input
                        label="Rating (1-5)"
                        type="number"
                        placeholder="Enter rating"
                        {...register("rating")}
                        error={errors.rating?.message}
                    />

                    {/* Review Text */}
                    <div className="mb-4">
                        <label className="block mb-1 text-black">Review</label>
                        <textarea
                            rows="4"
                            placeholder="Write your experience..."
                            {...register("review")}
                            className={`w-full px-4 py-2 rounded-lg border 
              focus:outline-none focus:ring-2 focus:ring-[#0A3D62]
              ${errors.review ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {errors.review && (
                            <span className="text-red-500 text-sm">
                                {errors.review.message}
                            </span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-[#0A3D62] text-white py-2 rounded-lg hover:bg-blue-900 transition"
                    >
                        Submit Review
                    </button>

                </form>
            </div>
        </div>
    );
};

export default Reviews;