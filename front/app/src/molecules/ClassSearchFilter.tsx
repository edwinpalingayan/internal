// =============================================================================
// クラス選択画面 受講期で選ぶ
// =============================================================================
import * as React from "react";
import MainContainer from "@/layouts/MainLayout/MainLayout";
import CustomRadioGroup from "@/components/CutomRadio";
import CustomCheckboxGroup from "@/components/CustomCheckbox";
import CustomAccordion from "@/components/CustomAccordion";
import useMediaQuery from "@mui/material/useMediaQuery";

type Option = {
  value: string;
  label: string;
  defaultFlg?: "0" | "1" | string;
  disabled?: boolean;
};

type FilterSectionConfig = {
  title: string;
  type: "radio" | "checkbox";
  options: Option[];
  value?: string | string[];
  defaultValues?: string | string[];
  onChange?: (value: string | string[]) => void;
  name?: string;
  fullWidth?: boolean;
  // 将来的な拡張用: カスタムフィルター用のcomponentProps
  componentProps?: Record<string, unknown>;
};

type ScheduleProps = {
  courseTerm: Option[];
  hostCampus: Option[];
  subject: Option[];
  selectDayofWeek: Option[];
  onSubjectChange?: (checked: string[]) => void;
  subjectDefaultValues?: string[];
  onCourseTermChange?: (value: string) => void;
  selectedCourseTerm?: string;
  onHostCampusChange?: (checked: string[]) => void;
  onDayOfWeekChange?: (value: string) => void;
  selectedDayOfWeek?: string;
  defaultHostCampusEventParam?: string;
};

const filterComponentMap = {
  radio: CustomRadioGroup,
  checkbox: CustomCheckboxGroup,
};

export default function ClassSearchFilter({
  courseTerm,
  hostCampus,
  subject,
  selectDayofWeek,
  onSubjectChange,
  subjectDefaultValues = [],
  onCourseTermChange,
  selectedCourseTerm,
  onHostCampusChange,
  onDayOfWeekChange,
  selectedDayOfWeek,
  defaultHostCampusEventParam,
}: ScheduleProps) {
  const isMobile = useMediaQuery("(max-width:932px)");

  // Compute subject default checked only once (or when subject changes)
  const subjectDefaultChecked = React.useMemo(
    () =>
      subject.filter((opt) => opt.defaultFlg === "1").map((opt) => opt.value),
    [subject],
  );

  // Sync subject selection on mount/subject changes
  React.useEffect(() => {
    if (onSubjectChange) {
      const initValues =
        subjectDefaultChecked.length > 0
          ? subjectDefaultChecked
          : subjectDefaultValues;
      onSubjectChange(initValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(subjectDefaultChecked),
    JSON.stringify(subjectDefaultValues),
  ]);

  // 曜日選択の初期化やprops変更時の同期処理
  React.useEffect(() => {
    if (onDayOfWeekChange) {
      const initValue = selectedDayOfWeek || "no_specified";
      onDayOfWeekChange(initValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedDayOfWeek)]);

  // 会場選択のデフォルト値
  const hostCampusDefaultChecked = React.useMemo(
    () =>
      hostCampus
        .filter((opt) => opt.defaultFlg === "1")
        .map((opt) => opt.value),
    [hostCampus],
  );

  // 補助関数: 動的レンダリング用のフィルターセクション設定
  const filterSections: FilterSectionConfig[] = [
    {
      title: "受講期で選ぶ",
      type: "radio",
      options: courseTerm,
      value: selectedCourseTerm,
      defaultValues: hostCampusDefaultChecked,
      onChange: onCourseTermChange
        ? (value: string | string[]) => {
            if (typeof value === "string") {
              onCourseTermChange(value);
            }
          }
        : undefined,
    },
    {
      title: "会場を選択",
      type: "checkbox",
      options: hostCampus,
      defaultValues: Array.isArray(defaultHostCampusEventParam)
        ? defaultHostCampusEventParam
        : defaultHostCampusEventParam
          ? [defaultHostCampusEventParam]
          : [],
      onChange: onHostCampusChange
        ? (value: string | string[]) => {
            if (Array.isArray(value)) {
              onHostCampusChange(value);
            }
          }
        : undefined,
      name: "venue-checkbox-group",
    },
    {
      title: "科目で選ぶ",
      type: "checkbox",
      options: subject,
      defaultValues:
        subjectDefaultChecked.length > 0
          ? subjectDefaultChecked
          : subjectDefaultValues,
      onChange: onSubjectChange
        ? (value: string | string[]) => {
            if (Array.isArray(value)) {
              onSubjectChange(value);
            }
          }
        : undefined,
      name: "subject-checkbox-group",
      fullWidth: true,
    },
    {
      title: "曜日で選ぶ",
      type: "radio",
      options: selectDayofWeek,
      value: selectedDayOfWeek,
      onChange: onDayOfWeekChange
        ? (value: string | string[]) => {
            if (typeof value === "string") {
              onDayOfWeekChange(value);
            }
          }
        : undefined,
    },
  ];

  // ラジオボタンやチェックボックスの入力変更時のハンドラー
  const handleChange =
    (section: FilterSectionConfig) => (value: string | string[]) => {
      if (section.onChange) section.onChange(value);
    };

  return (
    <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
      <MainContainer
        containerSx={{ width: "calc(100vw - 2rem)" }}
        boxSx={isMobile ? { padding: "16px 12px" } : {}}
      >
        {filterSections.map((section) => {
          const FilterComponent = filterComponentMap[section.type];
          return (
            <CustomAccordion
              key={section.title}
              title={section.title}
              sx={
                section.title === "曜日で選ぶ"
                  ? { borderBottom: "none !important" }
                  : undefined
              }
            >
              <FilterComponent
                options={section.options}
                value={
                  section.type === "radio"
                    ? typeof section.value === "string"
                      ? section.value
                      : undefined
                    : undefined
                }
                defaultValues={
                  section.type === "checkbox"
                    ? Array.isArray(section.defaultValues)
                      ? section.defaultValues
                      : section.defaultValues !== undefined
                        ? [section.defaultValues]
                        : undefined
                    : undefined
                }
                onChange={handleChange(section)}
                name={section.name}
                fullWidth={section.fullWidth}
                {...(section.componentProps || {})}
              />
            </CustomAccordion>
          );
        })}
      </MainContainer>
    </div>
  );
}
