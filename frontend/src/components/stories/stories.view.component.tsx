import React, { useEffect, useState } from "react";
import { getShortenedText, ITopicData, topicsData } from "./stories.utils";
import toast, { Toaster } from "react-hot-toast";
import { useCreatePostMutation } from "../../redux/apis/post.api";

export interface IStories {
  uuid: string;
  title: string;
  content: string;
  tag: string;
  imageURL: string;
}

interface IPost extends IStories {
  topic: ITopicData[];
}

interface StoriesComponentProps {
  stories: IStories[];
  isLogin: boolean;
  setStories: (stories: IStories[]) => void;
}

/* ─── Inline styles (no extra CSS file needed) ─── */
const styles: Record<string, React.CSSProperties> = {
  /* action bar */
  actionBar: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "8px",
    marginBottom: "16px",
    alignItems: "center",
  },
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
    transition: "all 0.18s ease",
    background: "rgba(255,255,255,0.06)",
    color: "#d1d5db",
    backdropFilter: "blur(6px)",
  },
  publishBtn: {
    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    border: "none",
    color: "#fff",
    padding: "8px 22px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
    boxShadow: "0 4px 14px rgba(99,102,241,0.45)",
  },

  /* narration card */
  narrationCard: {
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid rgba(99, 102, 241, 0.25)",
    borderRadius: "16px",
    padding: "20px 24px",
    marginTop: "20px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
  },
  narrationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  narrationTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#e2e8f0",
    fontWeight: 700,
    fontSize: "15px",
  },
  readyBadge: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16,185,129,0.4)",
    color: "#34d399",
    fontSize: "11px",
    fontWeight: 600,
    borderRadius: "20px",
    padding: "3px 10px",
    letterSpacing: "0.04em",
  },
  storySubtitle: {
    color: "#64748b",
    fontSize: "12px",
    marginTop: "2px",
  },

  /* playback controls */
  controls: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginBottom: "20px",
  },
  playBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "10px 0",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "all 0.18s ease",
    background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
    color: "#93c5fd",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
  },
  pauseBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "10px 0",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(30,41,59,0.8)",
    color: "#94a3b8",
    transition: "all 0.18s ease",
  },
  resumeBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "10px 0",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid rgba(16,185,129,0.3)",
    background: "rgba(6,78,59,0.45)",
    color: "#34d399",
    transition: "all 0.18s ease",
  },
  stopBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "10px 0",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid rgba(239,68,68,0.3)",
    background: "rgba(127,29,29,0.4)",
    color: "#f87171",
    transition: "all 0.18s ease",
  },

  /* progress section */
  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  progressLabel: { color: "#64748b", fontSize: "12px", fontWeight: 500 },
  progressWords: { color: "#94a3b8", fontSize: "12px" },
  progressTrack: {
    width: "100%",
    height: "5px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "99px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #6366f1 0%, #a855f7 100%)",
    borderRadius: "99px",
    transition: "width 0.4s ease",
  },
  progressFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: { color: "#64748b", fontSize: "11px", fontStyle: "italic" },

  /* speed select */
  speedWrap: { display: "flex", alignItems: "center", gap: "8px" },
  speedLabel: { color: "#64748b", fontSize: "11px", fontWeight: 500 },
  speedSelect: {
    background: "rgba(30,41,59,0.9)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "7px",
    color: "#cbd5e1",
    fontSize: "12px",
    padding: "4px 8px",
    cursor: "pointer",
    outline: "none",
  },
};

/* ─── Playback sub-component ─── */
const NarrationPlayer: React.FC<{ title: string }> = ({ title }) => {
  const [progress] = useState(24);
  const [wordCount] = useState({ current: 12, total: 50 });

  return (
    <div style={styles.narrationCard}>
      {/* Header */}
      <div style={styles.narrationHeader}>
        <div>
          <div style={styles.narrationTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            Listen to this story
          </div>
          <div style={styles.storySubtitle}>{title}</div>
        </div>
        <span style={styles.readyBadge}>● Ready to narrate</span>
      </div>

      {/* Controls — contained grid, no overflow */}
      <div style={styles.controls}>
        <button style={styles.playBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          Play
        </button>
        <button style={styles.pauseBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          Pause
        </button>
        <button style={styles.resumeBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.51"/></svg>
          Resume
        </button>
        <button style={styles.stopBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          Stop
        </button>
      </div>

      {/* Progress */}
      <div style={styles.progressRow}>
        <span style={styles.progressLabel}>Progress</span>
        <span style={styles.progressWords}>{wordCount.current} / {wordCount.total} words</span>
      </div>
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <div style={styles.progressFooter}>
        <span style={styles.statusText}>Narration paused</span>
        <div style={styles.speedWrap}>
          <span style={styles.speedLabel}>Playback speed</span>
          <select style={styles.speedSelect} defaultValue="1">
            <option value="0.5">0.5×</option>
            <option value="0.75">0.75×</option>
            <option value="1">1×</option>
            <option value="1.25">1.25×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
        </div>
      </div>
    </div>
  );
};

/* ─── Main component ─── */
const StoriesViewComponent: React.FC<StoriesComponentProps> = ({
  stories,
  isLogin,
  setStories,
}) => {
  const [selectedStory, setSelectedStory] = useState<IStories | null>(
    stories && stories[0]
  );
  const [topics, setTopics] = useState<ITopicData[]>(topicsData);
  const [selectTopics, setSelectTopics] = useState<ITopicData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [createPost] = useCreatePostMutation();

  useEffect(() => {
    setSelectTopics(topics.filter((topic) => topic.selected));
  }, [topics]);

  useEffect(() => {
    if (stories && stories.length > 0) setSelectedStory(stories[0]);
  }, [stories]);

  const handelStorySelection = (story: IStories) => setSelectedStory(story);

  const handleTopicClick = (index: number) => {
    const updated = [...topics];
    updated[index].selected = !updated[index].selected;
    setTopics(updated);
  };

  const handleCopyStory = async () => {
    if (selectedStory?.content) {
      await navigator.clipboard.writeText(selectedStory.content);
      setIsCopied(true);
      toast.success("Story copied!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handelPublishStory = async () => {
    if (!isLogin) { toast.error("Please login to publish the story."); return; }
    if (!selectedStory) { toast.error("No story available. Please generate a story first."); return; }
    const post: IPost = { ...selectedStory, topic: selectTopics };
    setLoading(true);
    try {
      const result = await createPost(post).unwrap();
      if (result) {
        toast.success("Story published successfully!");
        setStories([]);
        setSelectedStory(null);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 px-4 sm:px-6 md:px-10 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="col-span-1 lg:col-span-8">

          {/* Title + story bubbles */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-5">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-400">
              {selectedStory?.title}
            </h1>
            <div className="flex justify-end">
              <div className="flex -space-x-4">
                {stories && stories.length > 0 ? (
                  stories.map((story) => (
                    <button
                      key={story.uuid}
                      className={`relative w-14 h-14 rounded-full border-2 ${
                        selectedStory?.uuid === story.uuid
                          ? "border-blue-500 scale-110"
                          : "border-white/20"
                      } hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-600`}
                      onClick={() => handelStorySelection(story)}
                    >
                      <img src={story.imageURL} alt={story.title} className="w-full h-full object-cover rounded-full" />
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm">No stories available.</span>
                )}
              </div>
            </div>
          </div>

          {/* Story card */}
          <div className="bg-blue-500/10 border border-gray-600 p-6 rounded-2xl shadow-lg">
            {/* Action toolbar */}
            <div style={styles.actionBar}>
              {selectedStory && (
                <button style={styles.actionBtn} onClick={handleCopyStory}>
                  {isCopied ? "✓" : "📋"} {isCopied ? "Copied" : "Copy"}
                </button>
              )}
              <button style={styles.actionBtn}>📄 Export PDF</button>
              <button style={styles.actionBtn}>⬇ Export Markdown</button>
              <button style={styles.actionBtn}>🗺 World Map</button>
              <button style={styles.actionBtn}>✨ Remix</button>
              <button style={styles.actionBtn}>🌐 Translate</button>
              <button
                style={{
                  ...styles.publishBtn,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={handelPublishStory}
                disabled={loading}
              >
                {loading ? "Publishing…" : "Publish"}
              </button>
            </div>

            {/* Story text */}
            <div className="prose max-w-none text-gray-300 text-sm sm:text-base leading-relaxed">
              {selectedStory ? (
                <p className="break-words">{selectedStory.content}</p>
              ) : (
                <p className="text-gray-500">No story available. Please generate a story first.</p>
              )}
            </div>

            {/* Narration player — fully inside the card */}
            {selectedStory && <NarrationPlayer title={selectedStory.title} />}
          </div>

          {/* Continue story button */}
          {selectedStory && (
            <div className="mt-5">
              <button className="px-6 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all duration-200">
                Continue Story
              </button>
            </div>
          )}

          {/* Topics */}
          <div className="mt-6">
            <div className="bg-blue-500/10 border border-gray-600 rounded-2xl shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-300 mb-4">Select Topics</h3>
              <div className="flex flex-wrap gap-2">
                {selectedStory ? (
                  topics.map((topic, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 ${topic.color} rounded-full text-sm hover:brightness-110 cursor-pointer transition-all`}
                      onClick={() => handleTopicClick(index)}
                    >
                      {topic.selected ? (
                        <i className="fa-solid fa-check mr-1" />
                      ) : (
                        <i className="fa-solid fa-plus mr-1" />
                      )}
                      {topic.title}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No topics available. Please generate a story first.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (preview) ── */}
        <div className="col-span-1 lg:col-span-4">
          <h1 className="text-2xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-400">
            Preview
          </h1>
          <div className="bg-blue-500/10 border border-gray-600 rounded-2xl shadow-lg overflow-hidden">
            {selectedStory ? (
              <div className="flex flex-col">
                <div className="m-2.5 overflow-hidden rounded-xl">
                  <img
                    src={selectedStory.imageURL}
                    alt="card-image"
                    className="w-full h-36 object-cover"
                  />
                </div>
                <div className="px-4 pb-4 pt-1">
                  <div className="mb-2 inline-flex items-center rounded-full bg-purple-600 py-1 px-3 text-xs font-semibold text-white shadow-sm">
                    {selectedStory.tag.toUpperCase()}
                  </div>
                  <h6 className="mb-1 text-gray-200 text-lg font-semibold">{selectedStory.title}</h6>
                  <p className="text-gray-400 text-sm leading-relaxed break-words">
                    {getShortenedText(selectedStory.content)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No story available. Please generate a story first.
              </div>
            )}
          </div>
        </div>
      </div>

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default StoriesViewComponent;