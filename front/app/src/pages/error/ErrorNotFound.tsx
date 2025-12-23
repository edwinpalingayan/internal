// =============================================================================
// ErrorNotFound画面
// =============================================================================
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MessageBoard from "@/components/MessageBoard";
import MainContainer from "@/layouts/MainLayout/MainLayout";

export default function ErrorNotFound() {
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
          <h2
            style={{
              fontSize: "32px",
              fontFamily: "Noto Sans JP, sans-serif",
              fontWeight: "400",
            }}
          >
            404
          </h2>
          <h2
            style={{
              fontSize: "1.375rem",
              fontFamily: "Noto Sans JP, sans-serif",
              fontWeight: "400",
            }}
          >
            {isMobile ? (
              <>
                お探しのページは
                <br />
                見つかりませんでした
              </>
            ) : (
              "お探しのページは見つかりませんでした"
            )}
          </h2>
        </div>
        <div>
          <p>
            {isMobile ? (
              <>
                申し訳ございません。
                <br />
                お探しのページが見つかりませんでした。
              </>
            ) : (
              "申し訳ございません。お探しのページが見つかりませんでした。"
            )}
          </p>
          <p>
            {isMobile ? (
              <>
                ご希望のページはURLが変更になったか、
                <br />
                削除あるいは一時的にアクセスできない状況にある可能性があります。
              </>
            ) : (
              "ご希望のページはURLが変更になったか、削除あるいは一時的にアクセスできない状況にある可能性があります。"
            )}
          </p>
          <p></p>
        </div>
      </MessageBoard>
    </MainContainer>
  );
}
