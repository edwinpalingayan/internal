import { Routes, Route } from 'react-router-dom';

import { URL_PREFIX } from '@/utils/config';

import Root from '@/pages/Root';

// Common Pages
import ErrorNotFound from '@/pages/error/ErrorNotFound';
import Expired from '@/pages/Expired';
import Thanks from '@/pages/Thanks';

// Admin and Event Pages
import EventDateSelector from '@/pages/admin/EventDateSelector';
import EventDetailPage from '@/pages/web/event/[EventDetailPage]';

function App() {
  return (
    <div style={{ overflowX: 'hidden' }}>
      {['/eventlist', '/web/event/:eventId'].some((path) =>
        window.location.pathname.includes(path.replace(':eventId', '')),
      ) ? (
        <div className="adminHeader">
          <div className="adminHeaderContainer">
            <img
              src="/images/universityLogoJp.png"
              alt="Globis University JP"
              className="adminHeaderLogo"
            />
          </div>
          <div className="titleContainer">
            <p className="mainTitle">イベント一覧</p>
          </div>
        </div>
      ) : (
        <img src="/images/universityLogoJp.png" alt="Globis University JP" className="mainLogo" />
      )}
      <Routes>
        {/* Routes with URL_PREFIX */}

        {/* Common Pages */}
        <Route path={`${URL_PREFIX}/`} element={<Root />} />
        <Route path={`${URL_PREFIX}/web/thanks`} element={<Thanks />} />
        <Route path={`${URL_PREFIX}/web/expired`} element={<Expired />} />
        <Route path={`${URL_PREFIX}/web/not-found`} element={<ErrorNotFound />} />

        {/* Admin and Event Pages */}
        <Route path={`${URL_PREFIX}/eventlist`} element={<EventDateSelector />} />
        <Route path="/web/event/:eventId" element={<EventDetailPage />} />

        {/* Routes without URL_PREFIX */}
        <Route path="/" element={<Root />} />
        <Route path="/web/thanks" element={<Thanks />} />
        <Route path="/web/expired" element={<Expired />} />
        <Route path="/web/not-found" element={<ErrorNotFound />} />

        {/* Catch-all route */}
        <Route path="*" element={<ErrorNotFound />} />
      </Routes>
    </div>
  );
}

export default App;
