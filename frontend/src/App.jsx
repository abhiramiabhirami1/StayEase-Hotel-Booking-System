
import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const roomImages = {
  Deluxe:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80",

  Luxury:
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80",

  Family:
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",

  Standard:
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",

  Premium:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80",

  Executive:
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80"
};

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Admin login states
const [adminToken, setAdminToken] = useState("");
const [adminUsername, setAdminUsername] = useState("");
const [adminPassword, setAdminPassword] = useState("");
const [adminLoggedIn, setAdminLoggedIn] = useState(false);
const [adminLoginMessage, setAdminLoginMessage] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const [message, setMessage] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Load all active rooms when the website opens
  useEffect(() => {
    async function loadRooms() {
      try {
        const response = await fetch(`${API}/rooms`);

        if (!response.ok) {
          throw new Error("Could not load rooms.");
        }

        const data = await response.json();

        setRooms(data.filter(room => room.status === "active"));
      } catch (error) {
        setMessage("Unable to load rooms. Please check the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadRooms();
  }, []);
    // Load bookings only after admin login
  useEffect(() => {
    if (!adminToken) {
      setAdminLoading(false);
      return;
    }

    async function loadBookings() {
      try {
        setAdminLoading(true);

        const response = await fetch(`${API}/bookings`, {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });

        if (!response.ok) {
          throw new Error("Could not load bookings");
        }

        const data = await response.json();
        setBookings(data);

      } catch (error) {
        console.error("Unable to load bookings:", error);
      } finally {
        setAdminLoading(false);
      }
    }

    loadBookings();
  }, [adminToken]);

  // Check actual room availability
  async function searchRooms() {
    setMessage("");
    setSelectedRoom(null);

    if (!checkIn || !checkOut) {
      setMessage("Please select check-in and check-out dates.");
      return;
    }

    if (
      checkIn < getToday() ||
      checkOut <= checkIn
    ) {
      setMessage("Please select valid future booking dates.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/bookings/availability?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Availability check failed.");
      }

      setAvailableRooms(data.rooms);
      setAvailabilityChecked(true);

      if (data.rooms.length === 0) {
        setMessage("Sorry! No rooms are available for these dates.");
      } else {
        setMessage(`${data.rooms.length} available room(s) found!`);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Confirm and save a booking
  async function confirmBooking(event) {
    event.preventDefault();

    if (!selectedRoom) return;

    try {
      setBookingLoading(true);
      setMessage("");

      const response = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomId: selectedRoom._id,
          customerName,
          email,
          phone,
          checkIn,
          checkOut,
          guests: Number(guests)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Booking failed.");
      }

      setMessage(
        `Booking confirmed! Your booking ID is ${data.booking._id}`
      );

      setSelectedRoom(null);
      setCustomerName("");
      setEmail("");
      setPhone("");

      // Refresh available rooms
  

    } catch (error) {
      setMessage(error.message);
    } finally {
      setBookingLoading(false);
    }
  }

  
  // Admin login function
  async function handleAdminLogin(event) {
    event.preventDefault();
    setAdminLoginMessage("");

    try {
      const response = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Admin login failed.");
      }

      setAdminToken(data.token);
      setAdminLoggedIn(true);
      setAdminPassword("");
      setAdminLoginMessage("Login successful!");

    } catch (error) {
      setAdminLoginMessage(error.message);
    }
  }

  return (
    <div className="website">

      {/* NAVIGATION */}
      <nav className="navbar">
        <a href="#home" className="logo">
          Stay<span>Ease.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#rooms">Our Rooms</a>
          <a href="#booking">Reservations</a>
          <a href="#admin">Admin</a>
        </div>

        <a href="#booking" className="nav-button">
          Book Now
        </a>
      </nav>

      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO STAYEASE</p>

          <h1>
            Your Perfect Stay
            <br />
            Begins Here.
          </h1>

          <p className="hero-description">
            Discover comfort, elegance and unforgettable
            experiences. Find the perfect room for your stay.
          </p>

          <a href="#rooms" className="hero-button">
            Explore Our Rooms →
          </a>
        </div>
      </section>

      {/* BOOKING SEARCH */}
      <section className="booking-section" id="booking">
        <div className="booking-box">

          <div className="booking-field">
            <label>CHECK-IN</label>
            <input
              type="date"
              value={checkIn}
              min={getToday()}
              onChange={e => setCheckIn(e.target.value)}
            />
          </div>

          <div className="booking-field">
            <label>CHECK-OUT</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || getToday()}
              onChange={e => setCheckOut(e.target.value)}
            />
          </div>

          <div className="booking-field">
            <label>GUESTS</label>
            <select
              value={guests}
              onChange={e => setGuests(e.target.value)}
            >
              {[1, 2, 3, 4, 5].map(number => (
                <option key={number} value={number}>
                  {number} {number === 1 ? "Guest" : "Guests"}
                </option>
              ))}
            </select>
          </div>

          <button
            className="search-button"
            onClick={searchRooms}
            disabled={loading}
          >
            {loading ? "Checking..." : "Check Availability"}
          </button>

        </div>

        {message && (
          <p className="search-message">{message}</p>
        )}
      </section>

      {/* ROOMS SECTION */}
      <section className="rooms-section" id="rooms">

        <div className="section-heading">
          <p className="eyebrow">COMFORT & ELEGANCE</p>
          <h2>Explore Our Rooms</h2>
          <p>Find a beautiful space designed for your comfort.</p>
        </div>

        {loading && <p>Loading rooms...</p>}

        {!loading && rooms.length === 0 && (
          <p>No rooms to display. Try different dates.</p>
        )}

        <div className="room-grid">

          {rooms.map(room => (
            <div className="room-card" key={room._id}>

              <img
                src={room.imageUrl || roomImages[room.roomType]}
                alt={room.roomName}
              />

              <div className="room-details">

                <h3>{room.roomName}</h3>

                <p>{room.description}</p>

                <p className="facilities">
                  {room.amenities.join(" · ")}
                </p>

                <p>Maximum guests: {room.capacity}</p>

                <div className="room-bottom">

                  <p>
                    ₹{room.pricePerNight.toLocaleString("en-IN")}
                    <span> / night</span>
                  </p>

                  <button
                    type="button"
                    className="search-button"
                    onClick={() => {
                      setSelectedRoom(room);
                      setMessage("");
                    }}
                  >
                    Book Now →
                  </button>

                </div>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* CUSTOMER BOOKING FORM */}
      {selectedRoom && (
        <section className="booking-section">
          <div className="booking-box">
            <div>
              <p className="eyebrow">COMPLETE YOUR RESERVATION</p>

              <h2>{selectedRoom.roomName}</h2>

              <p>
                ₹{selectedRoom.pricePerNight.toLocaleString("en-IN")}
                {" "}per night
              </p>

              <p>
                {checkIn} to {checkOut} · {guests} guest(s)
              </p>
            </div>

            <form onSubmit={confirmBooking}>

              <div className="booking-field">
                <label>FULL NAME</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="booking-field">
                <label>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="booking-field">
                <label>PHONE NUMBER</label>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="search-button"
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? "Confirming..."
                  : "Confirm Booking"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
              >
                Cancel
              </button>

            </form>
          </div>
        </section>
      )}

      {/* FOOTER */}
      
{/* ADMIN LOGIN AND DASHBOARD */}
<section className="admin-section" id="admin">

  {!adminLoggedIn ? (

    <div className="section-heading">
      <p className="eyebrow">STAYEASE MANAGEMENT</p>
      <h2>Admin Login</h2>
      <p>Login to access hotel management.</p>

      <form onSubmit={handleAdminLogin} className="admin-login-form">

        <div className="booking-field">
          <label>ADMIN USERNAME</label>
          <input
            type="text"
            placeholder="Enter admin username"
            value={adminUsername}
            onChange={e => setAdminUsername(e.target.value)}
            required
          />
        </div>

        <div className="booking-field">
          <label>ADMIN PASSWORD</label>
          <input
            type="password"
            placeholder="Enter admin password"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="search-button">
          Login as Admin
        </button>

        {adminLoginMessage && (
          <p>{adminLoginMessage}</p>
        )}

      </form>
    </div>

  ) : (

    <>
      <div className="section-heading">
        <p className="eyebrow">STAYEASE MANAGEMENT</p>
        <h2>Admin Dashboard</h2>
        <p>Manage hotel rooms and customer reservations.</p>

        <button
          className="search-button"
          onClick={() => {
            setAdminToken("");
            setAdminLoggedIn(false);
            setBookings([]);
            setAdminLoginMessage("");
          }}
        >
          Logout
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <h3>{rooms.length}</h3>
          <p>Total Rooms</p>
        </div>

        <div className="admin-stat">
          <h3>{bookings.length}</h3>
          <p>Total Bookings</p>
        </div>

        <div className="admin-stat">
          <h3>{bookings.filter(b => b.status === "confirmed").length}</h3>
          <p>Confirmed Bookings</p>
        </div>

        <div className="admin-stat">
          <h3>{bookings.filter(b => b.status === "cancelled").length}</h3>
          <p>Cancelled Bookings</p>
        </div>
      </div>

      <h3>Room Management</h3>

      <div className="admin-room-list">
        {rooms.map(room => (
          <div className="admin-row" key={room._id}>
            <span>{room.roomName}</span>
            <span>₹{room.pricePerNight.toLocaleString("en-IN")} / night</span>
            <span>{room.status}</span>
          </div>
        ))}
      </div>

      <h3>Customer Bookings</h3>

      {adminLoading ? (
        <p>Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Room</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Guests</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.customerName}</td>
                  <td>{booking.room?.roomName || "Room unavailable"}</td>
                  <td>{booking.email}</td>
                  <td>{booking.phone}</td>
                  <td>{new Date(booking.checkIn).toLocaleDateString("en-IN")}</td>
                  <td>{new Date(booking.checkOut).toLocaleDateString("en-IN")}</td>
                  <td>{booking.guests}</td>
                  <td>₹{booking.totalPrice?.toLocaleString("en-IN")}</td>
                  <td>{booking.status}</td>

<td>
  {booking.status === "confirmed" ? (
    <button
      className="search-button"
      onClick={async () => {
        const confirmCancel = window.confirm(
          "Are you sure you want to cancel this booking?"
        );

        if (!confirmCancel) return;

        try {
          const response = await fetch(
            `${API}/bookings/${booking._id}/cancel`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${adminToken}`
              }
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Cancellation failed");
          }

          setBookings(previous =>
            previous.map(item =>
              item._id === booking._id
                ? { ...item, status: "cancelled" }
                : item
            )
          );

          alert("Booking cancelled successfully!");

        } catch (error) {
          alert(error.message);
        }
      }}
    >
      Cancel Booking
    </button>
  ) : (
    "—"
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>

  )}

</section>

      <footer>
        <h2>Stay<span>Ease.</span></h2>
        <p>Comfort, care and unforgettable stays.</p>
        <p>© 2026 StayEase Hotel Booking System</p>
      </footer>

    </div>
  );
}

export default App;
