import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PackageDetailsPage() {
  const { id } = useParams();
  const [packageData, setPackageData] = useState(null);

  useEffect(() => {
    axios.get(`/api/packages/${id}`)
      .then(res => setPackageData(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!packageData) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{packageData.name}</h1>
      <img 
        src={packageData.image} 
        alt={packageData.name} 
        style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }} 
      />
      <p>{packageData.description}</p>
      <p>Price: ${packageData.price}</p>
    </div>
  );
}

export default PackageDetailsPage;
