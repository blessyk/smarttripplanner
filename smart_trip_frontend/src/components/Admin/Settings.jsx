import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { FaSpinner } from "react-icons/fa";
import api from "../Utils/api";
import { toast } from "react-toastify";

export default function Settings() {
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [selectedModel, setSelectedModel] = useState("gemini-flash-latest");
  const [updatingSetting, setUpdatingSetting] = useState(false);
  const [availableModels, setAvailableModels] = useState([
    { value: "gemini-flash-latest", label: "gemini-flash-latest (Fastest/Default)" },
    { value: "gemini-2.5-flash",    label: "gemini-2.5-flash" },
    { value: "gemini-2.5-pro",      label: "gemini-2.5-pro" },
    { value: "gemini-2.0-flash",    label: "gemini-2.0-flash" },
    { value: "gemini-3.5-flash",    label: "gemini-3.5-flash" },
  ]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [updatingProviderSetting, setUpdatingProviderSetting] = useState(false);
  const [portalLogo, setPortalLogo] = useState("/logo.png");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showAiLogs, setShowAiLogs] = useState(true);

  useEffect(() => {
    const initSettings = async () => {
      try {
        setLoadingModels(true);
        const [settingRes, modelsRes, providerRes, logoRes, showLogsRes] = await Promise.all([
          api.get("/admin/settings/gemini-model").catch(err => {
            console.error("Failed to load model setting:", err);
            return null;
          }),
          api.get("/admin/settings/gemini-available-models").catch(err => {
            console.error("Failed to load available models:", err);
            return null;
          }),
          api.get("/admin/settings/ai-provider").catch(err => {
            console.error("Failed to load provider setting:", err);
            return null;
          }),
          api.get("/admin/settings/portal-logo").catch(err => {
            console.error("Failed to load logo setting:", err);
            return null;
          }),
          api.get("/admin/settings/show-ai-logs").catch(err => {
            console.error("Failed to load show-ai-logs setting:", err);
            return null;
          })
        ]);

        if (settingRes?.data?.success && settingRes.data.data) {
          setSelectedModel(settingRes.data.data.value);
        }
        if (modelsRes?.data?.success && Array.isArray(modelsRes.data.data)) {
          setAvailableModels(modelsRes.data.data);
        }
        if (providerRes?.data?.success && providerRes.data.data) {
          setSelectedProvider(providerRes.data.data.value);
        }
        if (logoRes?.data?.success && logoRes.data.data) {
          setPortalLogo(logoRes.data.data.value);
        }
        if (showLogsRes?.data?.success && showLogsRes.data.data) {
          setShowAiLogs(showLogsRes.data.data.value === "true");
        }
      } catch (err) {
        console.error("Error initializing settings:", err);
      } finally {
        setLoadingModels(false);
      }
    };
    initSettings();
  }, []);

  if (!isLoggedIn) return <Navigate to="/" />;

  const handleModelSave = async () => {
    setUpdatingSetting(true);
    try {
      const response = await api.put("/admin/settings/gemini-model", {
        value: selectedModel
      });
      if (response.data?.success) {
        toast.success("Successfully updated Gemini AI model!");
      } else {
        toast.error("Failed to update setting.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating settings.");
    } finally {
      setUpdatingSetting(false);
    }
  };

  const handleProviderSave = async (e) => {
    e.preventDefault();
    setUpdatingProviderSetting(true);
    try {
      const response = await api.put("/admin/settings/ai-provider", {
        value: selectedProvider
      });
      if (response.data?.success) {
        toast.success("Successfully updated active AI Provider!");
      } else {
        toast.error("Failed to update active AI Provider.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating provider settings.");
    } finally {
      setUpdatingProviderSetting(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploadingLogo(true);
    try {
      const uploadRes = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (uploadRes.data?.success && uploadRes.data.url) {
        const newLogoUrl = uploadRes.data.url;
        const saveRes = await api.put("/admin/settings/portal-logo", {
          value: newLogoUrl
        });

        if (saveRes.data?.success) {
          setPortalLogo(newLogoUrl);
          toast.success("Branding portal logo updated successfully!");
          setTimeout(() => window.location.reload(), 1000);
        } else {
          toast.error("Failed to store logo path in database.");
        }
      } else {
        toast.error("Failed to upload image file to server.");
      }
    } catch (err) {
      console.error("Error setting portal logo:", err);
      toast.error(err.response?.data?.message || "An error occurred during logo upload.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleAiLogs = async (checked) => {
    setShowAiLogs(checked);
    try {
      const response = await api.put("/admin/settings/show-ai-logs", {
        value: String(checked)
      });
      if (response.data?.success) {
        toast.success(`Successfully ${checked ? "enabled" : "disabled"} AI Call Logs menu!`);
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error("Failed to update AI logs setting.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating settings.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 p-6 text-slate-100">
      <h1 className="text-2xl font-extrabold text-slate-100 mb-1 tracking-tight">System Settings</h1>
      <p className="mb-7 text-slate-500 text-sm">Configure dynamic AI services and portal branding options</p>

      {/* AI Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* AI Provider Config */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md">
          <h2 className="text-slate-100 font-semibold text-sm mb-1">🤖 Active AI Provider</h2>
          <p className="text-slate-500 text-xs mb-4">Choose which AI API is used dynamically for planning and analysis.</p>
          
          <form onSubmit={handleProviderSave} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="ai-provider"
                  value="gemini"
                  checked={selectedProvider === "gemini"}
                  onChange={() => setSelectedProvider("gemini")}
                  className="text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-800"
                />
                <span>Google Gemini API</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="ai-provider"
                  value="groq"
                  checked={selectedProvider === "groq"}
                  onChange={() => setSelectedProvider("groq")}
                  className="text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-800"
                />
                <span>Groq Cloud API (Llama 3)</span>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={updatingProviderSetting}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {updatingProviderSetting ? <FaSpinner className="animate-spin text-xs" /> : "Save Provider"}
            </button>
          </form>
        </div>

        {/* Gemini Model Config */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md">
          <h2 className="text-slate-100 font-semibold text-sm mb-1">⚙️ Gemini Model Selection</h2>
          <p className="text-slate-550 text-xs mb-4">Select the specific model to target when Google Gemini is active.</p>
          
          <div className="space-y-4">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loadingModels || updatingSetting}
              className="w-full px-3 py-2 bg-slate-955 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-200 font-medium disabled:opacity-50"
            >
              {loadingModels ? (
                <option>Loading models...</option>
              ) : (
                availableModels.map((model) => (
                  <option key={model.value} value={model.value} className="bg-slate-900 text-slate-200">
                    {model.label}
                  </option>
                ))
              )}
            </select>
            
            <button
              onClick={handleModelSave}
              disabled={updatingSetting || loadingModels}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-500"
            >
              {updatingSetting ? <FaSpinner className="animate-spin text-xs" /> : "Save Gemini Model"}
            </button>
          </div>
        </div>

      </div>

      {/* Portal Logo Settings */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md mt-6">
        <h2 className="text-slate-100 font-semibold text-sm mb-1">🖼️ Portal Branding & Logo</h2>
        <p className="text-slate-550 text-xs mb-4">Upload and configure the official logo displayed on the landing page header and system navigation sidebars.</p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Preview */}
          <div className="w-24 h-24 rounded-2xl bg-slate-955 border border-slate-800 flex items-center justify-center p-3 flex-shrink-0">
            {portalLogo ? (
              <img src={portalLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-slate-500 text-xs">No Logo</span>
            )}
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upload Logo File</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-955/40 file:text-rose-350 hover:file:bg-rose-900/40 cursor-pointer"
              />
            </div>
            <p className="text-slate-500 text-[10px]">Supported formats: PNG, JPG, WEBP, SVG. Recommend high contrast icons with transparent backgrounds.</p>
            {uploadingLogo && (
              <div className="flex items-center gap-2 text-xs text-rose-450 font-semibold">
                <FaSpinner className="animate-spin text-sm" /> Saving logo changes...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Options Settings */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-md mt-6">
        <h2 className="text-slate-100 font-semibold text-sm mb-1">🛠️ Menu Configurations</h2>
        <p className="text-slate-550 text-xs mb-4">Choose which administration menus are visible in the navigation sidebar.</p>
        
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
          <div>
            <h4 className="text-slate-200 font-medium text-xs">Show AI Call Logs Menu</h4>
            <p className="text-[10px] text-slate-500">Enable this setting to display the AI request/response logger in the administration navigation list.</p>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showAiLogs}
              onChange={(e) => handleToggleAiLogs(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600 peer-checked:after:bg-white"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
