import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from '@/views/Landing';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<DashboardLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
