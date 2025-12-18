import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./ObituaryDetails.css";
import Nav from "../../Nav/Nav";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const URL = "http://localhost:5000/users";

function ObituaryDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [condolences, setCondolences] = useState([]);
  const [message, setMessage] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const navigate = useNavigate();
  const ComponentsRef = useRef();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

// Fetch user
  useEffect(() => {
    axios.get(`${URL}/${id}`).then((res) => setUser(res.data));
  }, [id]);

  
// Fetch condolences for this user
  const fetchCondolences = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/condolences/${id}`);
      setCondolences(res.data.data);
    } catch (e) {
      console.error("Error fetching condolences", e);
    }
  };

  useEffect(() => {
    fetchCondolences();
  }, [id]);


// Delete user
  const deleteHandler = () => {
    setShowConfirmModal(true);
    };

  const confirmDelete = async () => {
  try {
    await axios.delete(`${URL}/${id}`);
    alert("Obituary deleted successfully!");
    navigate("/obituaries");
    } catch (err) {
    console.error("Error deleting obituary:", err);
    alert("Failed to delete obituary. Please try again.");
    } finally {
    setShowConfirmModal(false);
    }
  };



// Print handler
  const handlePrint = useReactToPrint({
    content: () => ComponentsRef.current,
    documentTitle: "Obituary Poster",
    onAfterPrint: () => alert("Users Report Successfully Downloaded!"),
  });

  const handleClickPrint = () => {
    if (ComponentsRef.current) handlePrint();
    else alert("Print area not found");
    setTimeout(() => window.print(), 500);
  };


// Share functions
  const handleShare = (platform) => {
    const pageUrl = window.location.href;
    const text = `🕊️ View this obituary: ${user.name}\n`;

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          pageUrl
        )}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
          text
        )}%20${encodeURIComponent(pageUrl)}`;
        break;
      case "copy":
        const fullUrl = window.location.origin + window.location.pathname;
        const messageCopy = `🕊️ View this obituary: ${user.name}\n${fullUrl}`;
        navigator.clipboard.writeText(messageCopy).then(() => {
          toast.success("Link copied to clipboard!", {
            position: "bottom-center",
            autoClose: 2000,
            hideProgressBar: true,
          });
        });
        return;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
  };

  
// Condolence handlers
  const handleMediaChange = (e) => setMediaFiles(e.target.files);

  const handleCondolenceSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", "Anonymous");
    formData.append("message", message);
    for (let i = 0; i < mediaFiles.length; i++) {
      formData.append("media", mediaFiles[i]);
    }

    try {
      await axios.post(
        `http://localhost:5000/condolences/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessage("");
      setMediaFiles([]);
      fetchCondolences(); // Refresh list
    } catch (e) {
      console.error("Error posting condolence", e);
    }
  };

  if (!user) return <h2>Loading...</h2>;

  return (
    <div className="obituary-details">
      <Nav />
      <div className="details">
        <div ref={ComponentsRef} className="obituary-print-area">
          <div className="obituary-info">
                  {user.image && (
                    <img
                      src={`http://localhost:5000/uploads/${user.image}`}
                      height={100}
                      width={100}
                      alt="Obituary"
                    />
                  )}
          </div>

          <h1>
            {user.name} 
          </h1>
          <h2>
            {user.nickName ? `(${user.nickName})` : ""}
          </h2>
          <p>
            {user.DoB
              ? new Date(user.DoB).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
            {" - "}
            {user.DoD
              ? new Date(user.DoD).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
          <p>
            <b>Age:</b> {user.Age}
          </p>
          <p>
            <b>Address:</b> {user.address}
          </p>
          <p>{user.Tline}</p>
          <p>
            <b>Funeral Date:</b> {user.Fdate ? user.Fdate.slice(0, 10) : ""}
          </p>
          <p>
            <b>Funeral Time:</b> {user.Ftime}
          </p>
          <p>
            <b>Funeral Venue:</b> {user.Fvenue}
          </p>
          <p>
            <b>Burial or Cremation:</b> {user.BorC}
          </p>
          <p>{user.Msg}</p>
        </div>

        <div className="obituary-actions">
          <Link to={`/obituaries/${id}/edit`} className="update-btn">
            Edit
          </Link>
        {/*  <button onClick={deleteHandler} className="delete-btn">
            Delete
          </button> */}
          <br />
          <br />
          <button onClick={handleClickPrint} className="download" >
            Download Report
          </button>
          <br />
          <br />
          
             {/* Condolence Section */}
        <div className="condolence-section">
          <h3>Leave a Condolence</h3>
          <form onSubmit={handleCondolenceSubmit}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your condolence..."

            />
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
            />
            <button type="submit">Post</button>
          </form>

          <div className="condolence-list">
                 {condolences.map((c) => (
                 <div key={c._id}>
          <div className="condolence-card">
             <p>{c.message}</p>
             {c.media.map((file, idx) =>
             file.match(/\.(mp4|webm)$/) ? (
            <video
              key={idx}
              controls
              width="200"
              src={`http://localhost:5000/uploads/${file}`}
            />
          ) : (
            <img
              key={idx}
              width="200"
              src={`http://localhost:5000/uploads/${file}`}
              alt="condolence media"
            />
            )
            )}
             </div>
             <hr style={{ border: "1px solid grey", margin: "10px 0" }} />
            </div>
            ))}
              {condolences.length === 0 && <p>No condolences yet.</p>}
          </div>
        </div>
        <br />
          <div className="share-buttons">
            <h3>Share this Obituary:</h3>
            <button onClick={() => handleShare("facebook")}>Facebook</button>
            <button onClick={() => handleShare("whatsapp")}>WhatsApp</button>
            <button onClick={() => handleShare("copy")}>Copy Link</button>
          </div>
        </div>

        {showConfirmModal && (
           <div className="modal-overlay">
             <div className="modal-content">
                 <h3>Confirm Deletion</h3>
                 <p>Are you sure you want to delete this obituary?</p>
               <div className="modal-buttons">
                 <button onClick={confirmDelete} className="confirm-btn">Yes, Delete</button>
                 <button onClick={() => setShowConfirmModal(false)} className="cancel-btn">Cancel</button>
               </div>
             </div>
           </div>
          )}
        </div>
    </div>
  );
}

export default ObituaryDetails;
