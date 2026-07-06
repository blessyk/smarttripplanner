import * as Yup from "yup";

export const registerSchema = Yup.object({
    name: Yup.string().required("Name is required"),

    email: Yup.string()
        .email("Invalid email")
        .required("Email is required"),

    phone: Yup.string()
        .matches(/^\d{10}$/, "Phone must be 10 digits")
        .required("Phone is required"),

    password: Yup.string()
        .min(8, "Minimum 8 characters")
        .matches(/[a-z]/, "Must contain at least one lowercase letter")
        .matches(/[A-Z]/, "Must contain at least one uppercase letter")
        .matches(/[0-9]/, "Must contain at least one number")
        .matches(/[^A-Za-z0-9]/, "Must contain at least one special character")
        .required("Password is required"),

    confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Confirm your password"),

    aadhaar: Yup
        .string()
        .required("Aadhaar is required")
        .matches(/^[2-9][0-9]{11}$/, "Invalid Aadhaar number")

})