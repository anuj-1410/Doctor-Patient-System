import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const emptyAuth = { token: "", role: "", username: "" };

const loadStoredAuth = () => {
  try {
    const raw = localStorage.getItem("dpms.auth");
    if (!raw) {
      return emptyAuth;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== "string") {
      return emptyAuth;
    }
    return {
      token: parsed.token || "",
      role: parsed.role || "",
      username: parsed.username || ""
    };
  } catch {
    return emptyAuth;
  }
};

export default function App() {
  const [auth, setAuth] = useState(loadStoredAuth);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientForm, setPatientForm] = useState({
    patientName: "",
    age: "",
    disease: ""
  });
  const [doctorForm, setDoctorForm] = useState({
    doctorName: "",
    specialization: "",
    email: ""
  });
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [working, setWorking] = useState(false);

  const isLoggedIn = Boolean(auth.token);
  const isAdmin = auth.role === "ADMIN";

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem("dpms.auth", JSON.stringify(auth));
    } else {
      localStorage.removeItem("dpms.auth");
    }
  }, [auth]);

  const apiFetch = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (auth.token) {
      headers.set("Authorization", `Bearer ${auth.token}`);
    }
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json()
      : null;
    if (!res.ok) {
      const message =
        data?.message ||
        data?.error ||
        `Request failed (${res.status})`;
      throw new Error(message);
    }
    return data;
  };

  const loadPatients = async () => {
    setLoadingPatients(true);
    try {
      const data = await apiFetch("/api/patients");
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus({ type: "error", message: `Patients: ${err.message}` });
    } finally {
      setLoadingPatients(false);
    }
  };

  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const data = await apiFetch("/api/doctors");
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setStatus({ type: "error", message: `Doctors: ${err.message}` });
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    if (!auth.token) {
      setPatients([]);
      setDoctors([]);
      return;
    }
    loadPatients();
    if (auth.role === "ADMIN") {
      loadDoctors();
    }
  }, [auth.token, auth.role]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setWorking(true);
    setStatus({ type: "info", message: "Signing in..." });
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : null;
      if (!res.ok) {
        const message =
          data?.message ||
          data?.error ||
          `Login failed (${res.status})`;
        throw new Error(message);
      }
      setAuth({
        token: data.token,
        role: data.role,
        username: loginForm.username
      });
      setLoginForm({ username: "", password: "" });
      setStatus({ type: "success", message: "Signed in." });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setWorking(false);
    }
  };

  const handleLogout = () => {
    setAuth(emptyAuth);
    setStatus({ type: "info", message: "Signed out." });
  };

  const handleCreateDoctor = async (event) => {
    event.preventDefault();
    if (
      !doctorForm.doctorName ||
      !doctorForm.specialization ||
      !doctorForm.email
    ) {
      setStatus({ type: "error", message: "Fill all doctor fields." });
      return;
    }
    setWorking(true);
    try {
      await apiFetch("/api/doctors", {
        method: "POST",
        body: JSON.stringify(doctorForm)
      });
      setDoctorForm({ doctorName: "", specialization: "", email: "" });
      setStatus({ type: "success", message: "Doctor added." });
      await loadDoctors();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setWorking(false);
    }
  };

  const handleCreatePatient = async (event) => {
    event.preventDefault();
    if (!patientForm.patientName || !patientForm.age || !patientForm.disease) {
      setStatus({ type: "error", message: "Fill all patient fields." });
      return;
    }
    setWorking(true);
    try {
      await apiFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          patientName: patientForm.patientName,
          age: Number(patientForm.age),
          disease: patientForm.disease
        })
      });
      setPatientForm({ patientName: "", age: "", disease: "" });
      setStatus({ type: "success", message: "Patient added." });
      await loadPatients();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setWorking(false);
    }
  };

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Delete this doctor?")) {
      return;
    }
    setWorking(true);
    try {
      await apiFetch(`/api/doctors/${id}`, { method: "DELETE" });
      setStatus({ type: "success", message: "Doctor removed." });
      await loadDoctors();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setWorking(false);
    }
  };

  const handleDeletePatient = async (id) => {
    if (!window.confirm("Delete this patient?")) {
      return;
    }
    setWorking(true);
    try {
      await apiFetch(`/api/patients/${id}`, { method: "DELETE" });
      setStatus({ type: "success", message: "Patient removed." });
      await loadPatients();
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setWorking(false);
    }
  };

  const statusClass = status.type ? `status status--${status.type}` : "status";

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Doctor Patient Management</h1>
          <p>Minimal React client for the Spring Boot API.</p>
          {status.message && <div className={statusClass}>{status.message}</div>}
        </div>
        <div className="inline">
          {isLoggedIn ? (
            <>
              <span className="chip">{auth.role || "USER"}</span>
              <span className="muted">{auth.username}</span>
              <button
                className="button button--ghost"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <span className="muted">Not signed in</span>
          )}
        </div>
      </header>

      {!isLoggedIn ? (
        <section className="panel" style={{ "--delay": "80ms" }}>
          <div className="panel__header">
            <div>
              <h2>Login</h2>
              <p>Use your backend credentials.</p>
            </div>
          </div>
          <form className="form" onSubmit={handleLogin}>
            <div className="form-row">
              <input
                className="input"
                type="text"
                name="username"
                placeholder="Username"
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, username: event.target.value })
                }
                autoComplete="username"
              />
              <input
                className="input"
                type="password"
                name="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
                autoComplete="current-password"
              />
            </div>
            <div className="inline">
              <button
                className="button"
                type="submit"
                disabled={
                  working || !loginForm.username || !loginForm.password
                }
              >
                Sign in
              </button>
              <span className="muted">
                Try admin/admin123 or doctor/doctor123
              </span>
            </div>
          </form>
          <div className="footer-note">
            API base is /api in dev. Set VITE_API_URL for another host.
          </div>
        </section>
      ) : (
        <>
          {isAdmin && (
            <section className="panel" style={{ "--delay": "80ms" }}>
              <div className="panel__header">
                <div>
                  <h2>Doctors</h2>
                  <p>Admins can add or remove doctors.</p>
                </div>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={loadDoctors}
                  disabled={loadingDoctors}
                >
                  Refresh
                </button>
              </div>
              {loadingDoctors ? (
                <p className="muted">Loading doctors...</p>
              ) : doctors.length === 0 ? (
                <p className="muted">No doctors yet.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td>{doctor.doctorName}</td>
                        <td>{doctor.specialization}</td>
                        <td>{doctor.email}</td>
                        <td>
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            disabled={working}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <form className="form" onSubmit={handleCreateDoctor}>
                <div className="form-row">
                  <input
                    className="input"
                    type="text"
                    placeholder="Doctor name"
                    value={doctorForm.doctorName}
                    onChange={(event) =>
                      setDoctorForm({
                        ...doctorForm,
                        doctorName: event.target.value
                      })
                    }
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Specialization"
                    value={doctorForm.specialization}
                    onChange={(event) =>
                      setDoctorForm({
                        ...doctorForm,
                        specialization: event.target.value
                      })
                    }
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Email"
                    value={doctorForm.email}
                    onChange={(event) =>
                      setDoctorForm({ ...doctorForm, email: event.target.value })
                    }
                  />
                </div>
                <button className="button" type="submit" disabled={working}>
                  Add doctor
                </button>
              </form>
            </section>
          )}

          <section className="panel" style={{ "--delay": "120ms" }}>
            <div className="panel__header">
              <div>
                <h2>Patients</h2>
                <p>
                  {isAdmin
                    ? "Admins can manage patients."
                    : "Read only for doctors."}
                </p>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={loadPatients}
                disabled={loadingPatients}
              >
                Refresh
              </button>
            </div>
            {loadingPatients ? (
              <p className="muted">Loading patients...</p>
            ) : patients.length === 0 ? (
              <p className="muted">No patients yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Disease</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.patientName}</td>
                      <td>{patient.age}</td>
                      <td>{patient.disease}</td>
                      {isAdmin && (
                        <td>
                          <button
                            className="button button--danger"
                            type="button"
                            onClick={() => handleDeletePatient(patient.id)}
                            disabled={working}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {isAdmin && (
              <form className="form" onSubmit={handleCreatePatient}>
                <div className="form-row">
                  <input
                    className="input"
                    type="text"
                    placeholder="Patient name"
                    value={patientForm.patientName}
                    onChange={(event) =>
                      setPatientForm({
                        ...patientForm,
                        patientName: event.target.value
                      })
                    }
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Age"
                    value={patientForm.age}
                    onChange={(event) =>
                      setPatientForm({
                        ...patientForm,
                        age: event.target.value
                      })
                    }
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Disease"
                    value={patientForm.disease}
                    onChange={(event) =>
                      setPatientForm({
                        ...patientForm,
                        disease: event.target.value
                      })
                    }
                  />
                </div>
                <button className="button" type="submit" disabled={working}>
                  Add patient
                </button>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
