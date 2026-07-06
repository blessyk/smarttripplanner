// src/components/Router/Router.jsx
import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import App from "../../App";
import { fetchUserProfile } from "../redux/authSlice";
import AdminHome from "../Admin/AdminHome";
import UsersView from "../Admin/UsersView";
import TestimonialsView from "../Admin/TestimonialView";
import Layout from "../Admin/Layout";
import ContactView from "../Admin/ContactView";
import ChangePassword from "../Admin/ChangePassword";
import Dashboard from "../Tourist/Dashboard";
import TouristLayout from "../Tourist/Layout";
import Reviews from "../Tourist/Reviews";
import Profile from "../Tourist/Profile";
import DestinationSearch from "../Tourist/DestinationSearch";
import TripPlanner from "../Tourist/TripPlanner";
import GeneratedTrip from "../Tourist/GeneratedTrip";
import MyTrips from "../Tourist/MyTrips";
import AITravelAssistant from "../Tourist/AITravelAssistant";
import ImagePrediction from "../Tourist/ImagePrediction";
import AdminLogin from "../Admin/AdminLogin";
import AdminTrips from "../Admin/AdminTrips";
import AiLogsView from "../Admin/AiLogsView";
import AdminReviews from "../Admin/AdminReviews";
import Settings from "../Admin/Settings";

const PrivateRoute = ({ children, role }) => {
  const { isLoggedIn, user } = useSelector((state) => state.auth);

  if (isLoggedIn && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0A3D62]"></div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return role === "admin" ? <Navigate to="/admin-login" /> : <Navigate to="/" />;
  }

  if (role && user && user.role !== role) {
    return role === "admin" ? <Navigate to="/admin-login" /> : <Navigate to="/" />;
  }

  return children;
};

// Create routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/Admin",
    element: (
      <PrivateRoute role="admin">
        <Layout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
      {
        path: "adminhome",
        element: <AdminHome />,
      },
      {
        path: "users",
        element: <UsersView />,
      },
      {
        path: "testimonials",
        element: <TestimonialsView />,
      },
      {
        path: "contact",
        element: <ContactView />,
      },
      {
        path: "change-password",
        element: <ChangePassword />,
      },
      {
        path: "trips",
        element: <AdminTrips />,
      },
      {
        path: "ai-logs",
        element: <AiLogsView />,
      },
      {
        path: "reviews",
        element: <AdminReviews />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
  {
    path: "/Tourist",
    element: (
      <PrivateRoute role="user">
        <TouristLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "touristhome",
        element: <Dashboard />,
      },
      {
        path: "reviews",
        element: <Reviews />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "DestinationSearch",
        element: <DestinationSearch />,
      },
      {
        path: "TripPlanner",
        element: <TripPlanner />,
      },
      {
        path: "my-trips",
        element: <MyTrips />,
      },
      {
        path: "generated-trip/:id",
        element: <GeneratedTrip />,
      },
      {
        path: "image-prediction",
        element: <ImagePrediction />,
      },
      {
        path: "chat/:id",
        element: <AITravelAssistant />,
      }
    ],
  },
  {
    path: "/admin-login",
    element: <AdminLogin />,
  },
]);

export default function AppRouter() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <RouterProvider router={router} />
    </>
  );
}