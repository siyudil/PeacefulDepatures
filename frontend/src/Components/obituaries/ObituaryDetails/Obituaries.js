import React, { useRef, useState, useEffect } from "react";
import Nav from "../../Nav/Nav";
import axios from "axios";
import Obituary from "../Obituary/Obituary";
import "./Obituaries.css";

const URL = "http://localhost:5000/users";

const fetchHandler = async () => {
  return await axios.get(URL).then((res) => res.data);
};

function Obituaries() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const ComponentsRef = useRef();
  const [setObituaries] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [dobStart, setDobStart] = useState("");
  const [dobEnd, setDobEnd] = useState("");
  const [dodStart, setDodStart] = useState("");
  const [dodEnd, setDodEnd] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [burialType, setBurialType] = useState("");
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    fetchHandler().then((data) => {
      setUsers(data.users);
      setFilteredUsers(data.users);
    });
  }, []);

  // Filter logic
  useEffect(() => {
    let result = users;

    if (searchQuery)
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.nickName &&
            user.nickName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

    if (minAge) result = result.filter((user) => user.Age >= parseInt(minAge));
    if (maxAge) result = result.filter((user) => user.Age <= parseInt(maxAge));

    if (dobStart)
      result = result.filter(
        (user) => user.DoB && new Date(user.DoB) >= new Date(dobStart)
      );
    if (dobEnd)
      result = result.filter(
        (user) => user.DoB && new Date(user.DoB) <= new Date(dobEnd)
      );

    if (dodStart)
      result = result.filter(
        (user) => new Date(user.DoD) >= new Date(dodStart)
      );
    if (dodEnd)
      result = result.filter(
        (user) => new Date(user.DoD) <= new Date(dodEnd)
      );

    if (locationQuery)
      result = result.filter(
        (user) =>
          user.address &&
          user.address.toLowerCase().includes(locationQuery.toLowerCase())
      );

    if (burialType)
      result = result.filter((user) => user.BorC === burialType);

    setFilteredUsers(result);
    setNoResults(result.length === 0);
  }, [
    searchQuery,
    minAge,
    maxAge,
    dobStart,
    dobEnd,
    dodStart,
    dodEnd,
    locationQuery,
    burialType,
    users,
  ]);

  useEffect(() => {
  axios.get("http://localhost:5000/obituaries")
    .then(res => {
      // show only approved ones
      setObituaries(res.data.filter(o => o.status === "approved"));
    })
    .catch(err => console.error(err));
}, []);


  return (
    <div className="obit">
      <Nav />
      <div className="space">
        <h1>Obituary Wall</h1>
        <div className="obituaries-page">
          {/* Left filters panel */}
          <div className="filters-panel">
            <h2>Filters</h2>
            <input
              type="text"
              placeholder="Search by name/nickname"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="filter-group">
              <label>Age Range:</label>
              <br />
              <br />
              <input
                type="number"
                placeholder="Min Age"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
              <input
                type="number"
                placeholder="Max Age"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Date of Birth:</label>
               <br />
              <br />
              <input
                type="date"
                value={dobStart}
                onChange={(e) => setDobStart(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Date of Death:</label>
               <br />
              <br />
              <input
                type="date"
                value={dodStart}
                onChange={(e) => setDodStart(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Location:</label>
               <br />
              <br />
              <input
                type="text"
                placeholder="City / Address"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Burial Type:</label>
               <br />
              <br />
              <select
                value={burialType}
                onChange={(e) => setBurialType(e.target.value)}
              >
                <option value="">All</option>
                <option value="Burial">Burial</option>
                <option value="Cremation">Cremation</option>
              </select>
            </div>
            <button
            className="clear-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setMinAge("");
                setMaxAge("");
                setDobStart("");
                setDobEnd("");
                setDodStart("");
                setDodEnd("");
                setLocationQuery("");
                setBurialType("");
              }}
            >
              Clear All Filters
            </button>
          </div>

          {/* Right obituary cards */}
          <div className="obituaries-list" ref={ComponentsRef}>
            {noResults ? (
              <h2>No users found</h2>
            ) : (
              filteredUsers.map((user, i) => (
                <div className="obituaries-card" key={i}>
                  <Obituary user={user} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Obituaries;
