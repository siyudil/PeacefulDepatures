import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../../Nav/Nav";

function UpdateObituary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inputs, setInputs] = useState({
    name: "",
    nickName: "",
    DoB: "",
    DoD: "",
    Age: "",
    address: "",
    Fdate: "",
    Ftime: "",
    Fvenue: "",
    BorC: "",
    Tline: "",
    Msg: ""
  });

  const [image, setImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(""); // show current image

  // Fetch existing user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${id}`);
        const data = res.data;

        setInputs({
          name: data.name || "",
          nickName: data.nickName || "",
          DoB: data.DoB ? new Date(data.DoB).toISOString().split("T")[0] : "",
          DoD: data.DoD ? new Date(data.DoD).toISOString().split("T")[0] : "",
          Age: data.Age || "",
          address: data.address || "",
          Fdate: data.Fdate ? new Date(data.Fdate).toISOString().split("T")[0] : "",
          Ftime: data.Ftime || "",
          Fvenue: data.Fvenue || "",
          BorC: data.BorC || "",
          Tline: data.Tline || "",
          Msg: data.Msg || ""
        });

        setCurrentImage(data.image || "");
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUser();
  }, [id]);

  // Handle text input changes
  const handleChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // Submit updated data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      // Append all fields
      for (const key in inputs) {
        formData.append(key, inputs[key]);
      }

      // Append image if new one selected
      if (image) formData.append("image", image);

      await axios.put(`http://localhost:5000/users/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      navigate(`/obituaries/${id}`);
    } catch (err) {
      console.error("Error updating obituary:", err);
    }
  };

  return (
    <div className="add-obituary">
      <Nav />
      <div className="add-obituary-container">
        <h1>Update Obituary</h1>
        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <br />
          <input type="text" name="name" value={inputs.name} onChange={handleChange} required />
          <br /><br />

          <label>Nick Name</label>
          <br />
          <input type="text" name="nickName" value={inputs.nickName} onChange={handleChange} />
          <br /><br />

          <label>Date of Birth</label>
          <br />
          <input type="date" name="DoB" value={inputs.DoB} onChange={handleChange} required />
          <br /><br />

          <label>Date of Passing</label>
          <br />
          <input type="date" name="DoD" value={inputs.DoD} onChange={handleChange} required />
          <br /><br />

          <label>Age</label>
          <br />
          <input type="number" name="Age" value={inputs.Age} onChange={handleChange} required />
          <br /><br />

          <label>Address</label>
          <br />
          <input type="text" name="address" value={inputs.address} onChange={handleChange} required />
          <br /><br />

          <label>Current Image</label>
          <br />
          {currentImage && (
            <img src={`http://localhost:5000/uploads/${currentImage}`} alt="Current" width={200} />
          )}
          <br /><br />

          <label>Upload New Image</label>
          <br />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <br /><br />

          <label>Tribute Line</label>
          <br />
          <textarea
            name="Tline"
            value={inputs.Tline}
            onChange={handleChange}
            placeholder="Write a short tribute line..."
          />
          <br /><br />

          <h3>Funeral Info</h3>

          <label>Funeral Date</label>
          <br />
          <input type="date" name="Fdate" value={inputs.Fdate} onChange={handleChange} required />
          <br /><br />

          <label>Funeral Time</label>
          <br />
          <input type="time" name="Ftime" value={inputs.Ftime} onChange={handleChange} required />
          <br /><br />

          <label>Funeral Venue</label>
          <br />
          <input type="text" name="Fvenue" value={inputs.Fvenue} onChange={handleChange} required />
          <br /><br />

          <label>Burial or Cremation</label>
          <br />
          <select name="BorC" value={inputs.BorC} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Burial">Burial</option>
            <option value="Cremation">Cremation</option>
          </select>
          <br /><br />

          <label>Closing Message/Quote</label>
          <br />
          <textarea
            name="Msg"
            value={inputs.Msg}
            onChange={handleChange}
            placeholder="Write a message..."
          />
          <br /><br />

          <button type="submit">Update Obituary</button>
        </form>
      </div>
    </div>
  );
}

export default UpdateObituary;
