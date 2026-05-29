import React, { useState, useEffect, useRef } from "react";
import StoriesViewComponent, { IStories } from "./stories.view.component";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUserInfo, isLoggedIn } from "../../services/auth.service";
import { getRequestLimit, getWordCount, prompts } from "./stories.utils";
import {
  useGenerateFreeModelMutation,
  useGenerateModelMutation,
} from "../../redux/apis/ai.model.api";
import toast, { Toaster } from "react-hot-toast";
import { SubmitHandler, useForm } from "react-hook-form";
import { useGetProfileInfoQuery } from "../../redux/apis/user.api";
import { getErrorMessage } from "../../error/error.message";
import StoryGeneratingAnimation from "../loading/story-generating-animation.component";

type Inputs = { prompt: string };

/* ─── Inline styles ─── */
const s: Record<string, React.CSSProperties> = {
  /* top nav pill */
  navPill: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#9ca3af",
    padding: "8px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    textDecoration: "none",
    whiteSpace: "nowrap" as const,
  },
  /* prompt card */
  promptCard: {
    background: "rgba(30, 41, 80, 0.45)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "18px",
    padding: "24px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    resize: "none" as const,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#e2e8f0",
    fontSize: "16px",
    lineHeight: "1.7",
    letterSpacing: "0.015em",
    fontStyle: "italic",
  },
  generateBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    padding: "11px 28px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 18px rgba(99,102,241,0.45)",
  },
  kbdStyle: {
    padding: "2px 6px",
    fontSize: "11px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "5px",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  selectStyle: {
    width: "100%",
    padding: "10px 36px 10px 14px",
    background: "rgba(15,23,42,0.8)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#94a3b8",
    fontSize: "13px",
    outline: "none",
    appearance: "none" as const,
    cursor: "pointer",
  },
  /* limit modal */
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(6px)",
  },
  modalCard: {
    background: "linear-gradient(160deg, #0f172a 0%, #0d1526 100%)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "20px",
    boxShadow: "0 0 40px rgba(59,130,246,0.2)",
    maxWidth: "420px",
    width: "100%",
    padding: "32px 28px",
    textAlign: "center" as const,
  },
  lockIcon: {
    width: "60px",
    height: "60px",
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  loginModalBtn: {
    display: "block",
    width: "100%",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontWeight: 700,
    fontSize: "15px",
    padding: "13px",
    cursor: "pointer",
    textDecoration: "none",
    marginBottom: "10px",
    transition: "opacity 0.2s",
  },
  dismissBtn: {
    display: "block",
    width: "100%",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#6b7280",
    fontWeight: 500,
    fontSize: "14px",
    padding: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
};

const StoriesComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, setValue } = useForm<Inputs>();
  const [stories, setStories] = useState<IStories[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data } = useGetProfileInfoQuery(undefined);
  const userRole = getUserInfo();
  const login = isLoggedIn();
  const [generateModel] = useGenerateModelMutation();
  const [generateFreeModel] = useGenerateFreeModelMutation();
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [textareaValue, setTextareaValue] = useState<string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [guestRequestCount, setGuestRequestCount] = useState<number>(() =>
    parseInt(localStorage.getItem("guestRequestCount") || "0", 10)
  );
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  useEffect(() => {
    if (location.state?.prompt) {
      setTextareaValue(location.state.prompt);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => { setValue("prompt", textareaValue); }, [textareaValue, setValue]);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (!login && guestRequestCount >= 3) { setShowLimitModal(true); return; }
    if (!data.prompt) { toast.error("Please enter a prompt to generate a story."); return; }
    if (getWordCount(data.prompt) < 10) {
      toast.error("Please enter a prompt with at least 10 words to generate a story.");
      return;
    }
    setLoading(true);
    try {
      const res = login
        ? await generateModel(data).unwrap()
        : await generateFreeModel(data).unwrap();
      if (res) {
        toast.success(res.message);
        setStories(res.data as IStories[]);
        setSelectedPrompt("");
        setTextareaValue("");
        setValue("prompt", "");
        reset();
        if (!login) {
          const newCount = guestRequestCount + 1;
          setGuestRequestCount(newCount);
          localStorage.setItem("guestRequestCount", String(newCount));
        }
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPrompt(e.target.value);
    setTextareaValue(e.target.value);
  };

  const handleClearPrompt = () => {
    setTextareaValue("");
    setSelectedPrompt("");
    setValue("prompt", "");
    inputRef.current?.focus();
  };

  return (
    <div className="bg-gradient-to-br animate-gradient-slow min-h-screen">
      {/* ambient glow */}
      <div
        style={{
          position: "fixed",
          top: "-150px",
          left: "20%",
          width: "700px",
          height: "350px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* ── Top nav bar ── */}
        <div className="py-6 flex flex-row items-start justify-between gap-4">
          {/* Back */}
          <div className="pt-2">
            <Link to="/" style={s.navPill}>
              <i className="fa-solid fa-left-long" /> BACK
            </Link>
          </div>

          {/* Guest notice */}
          {!login && (
            <div className="pt-2">
              <div style={{ ...s.navPill, cursor: "default" }}>
                Free access for 3 requests —{" "}
                <Link to="/login" style={{ color: "#818cf8", fontWeight: 700, textDecoration: "underline" }}>
                  Login
                </Link>{" "}
                for more!
              </div>
            </div>
          )}

          {/* Usage / Upgrade */}
          <div className="flex flex-col items-end pt-2">
            <div style={s.navPill}>
              <span style={{ color: "#9ca3af", fontSize: "11px" }}>Per Month</span>{" "}
              {getRequestLimit(userRole?.subscriptionType as string)}
              <Link
                to="/pricing"
                style={{
                  borderLeft: "1px solid rgba(255,255,255,0.2)",
                  paddingLeft: "10px",
                  color: "#c4b5fd",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Upgrade
              </Link>
              <i className="fas fa-bolt" style={{ color: "#fbbf24" }} />
            </div>
            <div style={{ marginTop: "8px", color: "#4b5563", fontSize: "11px", textAlign: "right" }}>
              <div>This month: {login ? (data?.requestsThisMonth ?? 0) : guestRequestCount} requests</div>
              <div>Total posts: {login ? (data?.postsCount ?? 0) : 0}</div>
            </div>
          </div>
        </div>

        {/* ── Hero heading ── */}
        <div className="mt-8 mb-10 text-center">
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
              fontWeight: 800,
              color: "#e2e8f0",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
            }}
          >
            ✨ Turn Your Ideas Into{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #c084fc 0%, #818cf8 50%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Amazing Stories!
            </span>{" "}
            ✨
          </h1>
          <p style={{ color: "#4b5563", marginTop: "10px", fontSize: "14px" }}>
            Powered by AI — describe your idea, we'll craft the story.
          </p>
        </div>

        {/* ── Prompt card ── */}
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 4px" }}>
          <div style={s.promptCard}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Textarea */}
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <textarea
                  {...register("prompt")}
                  ref={inputRef}
                  style={s.textarea}
                  placeholder="Every great story begins with a single idea. What's yours?"
                  value={textareaValue}
                  onChange={(e) => setTextareaValue(e.target.value)}
                />
                {textareaValue.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearPrompt}
                    style={{
                      position: "absolute",
                      right: "4px",
                      top: "4px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#4b5563",
                      padding: "4px",
                      transition: "color 0.15s",
                    }}
                    aria-label="Clear prompt"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: "14px" }} />

              {/* Footer row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <p style={{ color: "#4b5563", fontSize: "11px" }}>
                  💡 Press{" "}
                  <kbd style={s.kbdStyle}>Tab</kbd>{" "}
                  to navigate &{" "}
                  <kbd style={s.kbdStyle}>Enter</kbd>{" "}
                  to generate
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...s.generateBtn,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  <i className="fas fa-wand-magic-sparkles" />
                  {loading ? "Generating…" : "Generate"}
                </button>
              </div>
            </form>
          </div>

          {/* Example prompts */}
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "#4b5563", fontSize: "12px", marginBottom: "6px" }}>
              Try an example prompt:
            </p>
            <div style={{ position: "relative" }}>
              <select
                style={s.selectStyle}
                value={selectedPrompt}
                onChange={handlePromptSelect}
              >
                <option value="" disabled>Select a prompt…</option>
                {prompts.map((item) => (
                  <option key={item.id} value={item.prompt} style={{ background: "#0f172a" }}>
                    {item.prompt}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#6b7280",
                  fontSize: "11px",
                }}
              >
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <StoryGeneratingAnimation />}

      <StoriesViewComponent
        stories={stories}
        isLogin={login}
        setStories={setStories}
      />

      {/* Limit modal */}
      {showLimitModal && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <div style={s.lockIcon}>
              <i className="fas fa-lock" style={{ fontSize: "22px", color: "#818cf8" }} />
            </div>
            <h3 style={{ color: "#e2e8f0", fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
              Free Limit Reached
            </h3>
            <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: 1.6, fontSize: "14px" }}>
              You've used all 3 free story generations. Log in to keep creating.
            </p>
            <Link to="/login" style={s.loginModalBtn}>
              Login to Continue
            </Link>
            <button style={s.dismissBtn} onClick={() => setShowLimitModal(false)}>
              Continue Browsing
            </button>
          </div>
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default StoriesComponent;