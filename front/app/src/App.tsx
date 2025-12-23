import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import { URL_PREFIX } from "@/utils/config";

import Root from "@/pages/Root";

// Common Pages
import ErrorNotFound from "@/pages/error/ErrorNotFound";
import Expired from "@/pages/Expired";
import Thanks from "@/pages/Thanks";

// Admin and Event Pages
import EventDateSelector from "@/pages/admin/EventDateSelector";
import EventDetailPage from "@/pages/web/event/[EventDetailPage]";

function App() {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState(() =>
    window.location.pathname.includes("/web/event/")
      ? "イベント詳細"
      : "イベント一覧",
  );

  useEffect(() => {
    const path = location.pathname;
    const title = path.includes("/web/event/")
      ? "イベント詳細"
      : "イベント一覧";
    setPageTitle(title);
    document.title = `${title} - Globis University JP`;
  }, [location.pathname]);

  const showAdminHeader = ["/eventlist", "/web/event/"].some((path) =>
    location.pathname.includes(path),
  );

  return (
    <div style={{ overflowX: "hidden" }}>
      {showAdminHeader ? (
        <div className="adminHeader">
          <div className="adminHeaderContainer">
            <img
              src="/images/universityLogoJp.png"
              alt="Globis University JP"
              className="adminHeaderLogo"
            />
          </div>
          <div className="titleContainer">
            <p className="mainTitle">{pageTitle}</p>
          </div>
        </div>
      ) : (
        <img
          src="/images/universityLogoJp.png"
          alt="Globis University JP"
          className="mainLogo"
        />
      )}
      <Routes>
        {/* Routes with URL_PREFIX */}

        {/* Common Pages */}
        <Route path={`${URL_PREFIX}/`} element={<Root />} />
        <Route path={`${URL_PREFIX}/web/thanks`} element={<Thanks />} />
        <Route path={`${URL_PREFIX}/web/expired`} element={<Expired />} />
        <Route
          path={`${URL_PREFIX}/web/not-found`}
          element={<ErrorNotFound />}
        />

        {/* Admin and Event Pages */}
        <Route
          path={`${URL_PREFIX}/eventlist`}
          element={<EventDateSelector />}
        />
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
