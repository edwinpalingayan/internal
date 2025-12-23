// =============================================================================
// Expired画面
// =============================================================================
import MainContainer from "@/layouts/MainLayout/MainLayout";
import CustomButton from "@/components/CustomButton";
import MessageBoard from "@/components/MessageBoard";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function Expired() {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");

  return (
    <MainContainer
      containerSx={{
        width: "calc(100vw - 2rem)",
      }}
      boxSx={{
        [theme.breakpoints.up("md")]: {
          maxWidth: "800px !important",
          margin: "0 auto",
        },
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "320px",
      }}
    >
      <MessageBoard>
        <div>
          <p>お申し込み可能な期間が過ぎています。</p>
          <p></p>
          <p>
            {isMobile ? (
              <>
                恐れ入りますが、
                <br />
                事務局までお問い合わせください。
              </>
            ) : (
              "恐れ入りますが、事務局までお問い合わせください。"
            )}
          </p>
        </div>
        <div style={{ display: "block", width: "100%", marginTop: "1rem" }}>
          <CustomButton
            color="customGray"
            width={{ xs: "100%", sm: "255px" }}
            variant="contained"
          >
            お問い合わせはこちら
          </CustomButton>
        </div>
      </MessageBoard>
    </MainContainer>
  );
}
