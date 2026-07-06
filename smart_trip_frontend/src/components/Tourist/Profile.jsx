import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Input from "../Input";

const TouristProfileForm = () => {

  const schema = yup.object().shape({
    fullName: yup.string().required("Full name is required"),
    email: yup.string().email("Invalid email").required("Email is required"),
    phone: yup
      .string()
      .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
      .required("Phone is required"),
    country: yup.string().required("Country is required"),
    passportNumber: yup.string().required("Passport number is required"),
    dateOfBirth: yup.date().required("Date of birth is required"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    console.log("Updated Profile:", data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow"
    >
      <h2 className="text-2xl font-bold mb-4">Update Tourist Profile</h2>

      <Input
        label="Full Name"
        placeholder="Enter your name"
        {...register("fullName")}
        error={errors.fullName?.message}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        {...register("email")}
        error={errors.email?.message}
      />

      <Input
        label="Phone"
        placeholder="Enter phone number"
        {...register("phone")}
        error={errors.phone?.message}
      />

      <Input
        label="Country"
        placeholder="Enter country"
        {...register("country")}
        error={errors.country?.message}
      />

      <Input
        label="Passport Number"
        placeholder="Enter passport number"
        {...register("passportNumber")}
        error={errors.passportNumber?.message}
      />

      <Input
        label="Date of Birth"
        type="date"
        {...register("dateOfBirth")}
        error={errors.dateOfBirth?.message}
      />

      <button
        type="submit"
        className="w-full bg-[#0A3D62] text-white py-2 rounded-lg hover:opacity-90"
      >
        Update Profile
      </button>
    </form>
  );
};

export default TouristProfileForm;