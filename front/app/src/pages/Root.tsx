import * as React from "react";
import { useEffect, useRef } from "react";

import { get } from "@/services/apiService";
import type { GetSchoolClassDetailsResponse } from "@/types/SchoolClassDetailsResponse";
import type { GetSchoolTmClassSearchResponse } from "@/types/SchoolTmClassSerchResponse";

import { useNavigate } from "react-router-dom";

export default function Root() {
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const schoolClassDetails = React.useRef<GetSchoolClassDetailsResponse | null>(
    null,
  );
  const schoolClassSearch = React.useRef<GetSchoolTmClassSearchResponse | null>(
    null,
  );

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchSchoolClassDetailsData = async () => {
      try {
        const res = await get<GetSchoolClassDetailsResponse>(
          "/api/ocrs_f/get_school_tm_class_syosai",
        );
        schoolClassDetails.current = res;
      } catch (error) {
        console.error("API request failed:", error);
      }
    };
    fetchSchoolClassDetailsData();

    const fetchSchoolClassSearchData = async () => {
      try {
        const res = await get<GetSchoolTmClassSearchResponse>(
          "/api/ocrs_f/get_school_tm_class_search",
        );
        schoolClassSearch.current = res;
      } catch (error) {
        console.error("API request failed:", error);
      }
    };
    fetchSchoolClassSearchData();
  }, [navigate]);

  return (
    <div>
      <h1>Root Page</h1>
    </div>
  );
}
