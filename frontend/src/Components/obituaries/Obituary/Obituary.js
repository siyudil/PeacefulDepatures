import React from 'react';
import './Obituary.css';
import { Link } from 'react-router';


function Obituary(props) {
    const {_id,name,image} = props.user;
  
  return (
    <div className="obituary-card">
      <Link 
      to={`/obituaries/${_id}`} 
      style={{ textDecoration: "none", color: "inherit" }}
      >
        {image && (
          <img 
          src={`http://localhost:5000/uploads/${image}`}
          height = {200}
          width = {200}
          align = "center"
          alt="Obituary"
          />
        )}
        <h2>{name}</h2>
      </Link>

    </div>
  );
}

export default Obituary
