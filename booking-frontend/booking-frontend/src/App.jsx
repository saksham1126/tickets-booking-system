import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import ShowtimesPage from './pages/ShowtimesPage';
import SeatMapPage from './pages/SeatMapPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:movieId" element={<MovieDetailPage />} />
      <Route path="/showtimes" element={<ShowtimesPage />} />
      <Route path="/seatmap" element={<SeatMapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<LoginPage defaultTab="admin" />} />
      <Route path="/owner" element={<LoginPage defaultTab="admin" />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
