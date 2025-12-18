import { useNavigate } from "react-router-dom";

function PendingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="pending-page"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f9f9f9",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: "center",
        color: "#333",
        padding: "20px"
      }}
    >
      <h2 style={{ fontSize: "28px", color: "#2c3e50", marginBottom: "15px" }}>
        Thank you for your submission
      </h2>
      <p style={{ fontSize: "18px", color: "#555", maxWidth: "600px", lineHeight: "1.6" }}>
        Your obituary is pending approval. It will be visible once approved by our team.
      </p>

      {/* Close Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "25px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#2c3e50",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background 0.3s"
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = "#1a252f")}
        onMouseOut={(e) => (e.target.style.backgroundColor = "#2c3e50")}
      >
        Close
      </button>
    </div>
  );
}

export default PendingPage;
