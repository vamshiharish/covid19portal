const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite = require("sqlite3");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

app.use(express.json());
const path = require("path");

const covidDataPortal = path.join(__dirname, "covid19IndiaPortal.db");

let db = null;
const initilizeServer = async () => {
  try {
    db = await open({
      filename: covidDataPortal,
      driver: sqlite.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000 port...http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initilizeServer();

const secretKey = "jbedhfflufnwjdjjh";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Invalid JWT Token");
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send("Invalid JWT Token");
  }
};

app.post("/login/", async (req, res) => {
  const { username, password } = req.body;
  const searchData = `
    SELECT * FROM user WHERE username = ${username};
  `;
  const newData = await db.get(searchData);

  // Check if user exists

  // Check if password is correct
  if (newData.password !== password) {
    res.status(400).send("Invalid password");
    return;
  } else if (newData !== undefined) {
    const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
    res.send({ jwtToken: token });
  } else if (newData.username !== username) {
    res.status(400).send("Invalid user");
    return;
  }

  // Create and send JWT token
});

app.get("/states/", verifyToken, async (req, res) => {
  const getDeatils = `
        SELECT * FROM state
   `;

  const getStates = await db.all(getDeatils);
  const newStates = [];
  for (let each of getStates) {
    const values = {
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    };
    newStates.push(values);
  }
  res.send(newStates);
});

// get states by sateId
app.get("/states/:stateId", verifyToken, async (req, res) => {
  const stateId = parseInt(req.params.stateId);

  const findState = `
    SELECT * FROM state WHERE state_id = ${stateId}
  `;
  const getState = await db.get(findState);
  if (!findState) {
    res.status(404).send("State not found");
    return;
  }
  const values = {
    stateId: getState.state_id,
    stateName: getState.state_name,
    population: getState.population,
  };
  res.send(values);
});

//API 4

app.post("/districts/", verifyToken, async (req, res) => {
  const { districtName, stateId, cases, cured, active, deaths } = req.body;

  const district = `
    INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths})
  `;

  await db.run(district);
  res.send("District Successfully Added");
});

//api 5

app.get("/districts/:districtId/", verifyToken, async (req, res) => {
  const districtId = parseInt(req.params.districtId);

  const findState = `
    SELECT * FROM district WHERE district_id = ${districtId}
  `;
  const getState = await db.get(findState);
  if (!findState) {
    res.status(404).send(`District with ID ${districtId} not found.`);
    return;
  }

  const values = {
    districtId: getState.district_id,
    districtName: getState.district_name,
    stateId: getState.state_id,
    cases: getState.cases,
    cured: getState.cured,
    active: getState.active,
    deaths: getState.deaths,
  };

  res.send(values);
});

// api 6
app.delete("/districts/:districtId/", verifyToken, async (req, res) => {
  const districtId = parseInt(req.params.districtId);

  const findState = `
    SELECT * FROM district WHERE district_id = ${districtId}
  `;
  const getState = await db.run(findState);
  if (!findState) {
    res.status(404).send(`District with ID ${districtId} not found.`);
    return;
  }

  res.send("District Removed");
});

//api 7

app.put("/districts/:districtId", verifyToken, async (req, res) => {
  const districtId = parseInt(req.params.districtId);
  const { districtName, stateId, cases, cured, active, deaths } = req.body;
  const updateDistrict = `
        UPDATE
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE
            district_id = '${districtId}'
  `;
  await db.run(updateDistrict);
  res.send("district updated successfully");
});

//api 8

app.get("/states/:stateId/stats", verifyToken, async (req, res) => {
  const stateId = parseInt(req.params.stateId);
  const totalSatatitics = `
    SELECT 
        SUM(cases) AS total_cases, SUM(cured) AS total_cured, SUM(active) AS total_active, SUM(deaths) AS total_deaths 
    FROM district  WHERE state_id = ${stateId}
  `;
  const total_values = await db.get(totalSatatitics);
  res.send(total_values);
});

module.exports = app;
