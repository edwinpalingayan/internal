// =============================================================================
// Thanks画面
// =============================================================================
import MainContainer from '@/layouts/MainLayout/MainLayout';
import CustomButton from '@/components/CustomButton';
import MessageBoard from '@/components/MessageBoard';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function Thanks() {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:768px)');

  return (
    <MainContainer
      containerSx={{
        width: 'calc(100vw - 2rem)',
      }}
      boxSx={{
        [theme.breakpoints.up('md')]: {
          maxWidth: '800px !important',
          margin: '0 auto',
        },
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '320px',
      }}
    >
      <MessageBoard>
        <div>
          <p>お申し込みありがとうございました。</p>
          <p>
            {isMobile ? (
              <>
                ご予約いただきました内容は、
                <br />
                メールにてご案内いたしました。
              </>
            ) : (
              'ご予約いただきました内容は、メールにてご案内いたしました。'
            )}
          </p>
        </div>
        <div>
          <p>メールアドレスの入力間違いなどでメールが届いていない可能性がありますが、</p>
          <p>３営業日以内に事務局から予約確認メールを@@@</p>
        </div>
        <div>
          <p>
            {isMobile ? (
              <>
                引き続き、単科審査応募フォームから
                <br />
                お手続きをお願いいたします。
              </>
            ) : (
              '引き続き、単科審査応募フォームからお手続きをお願いいたします。'
            )}
          </p>
          <p>
            {isMobile ? (
              <>
                もしよろしければ、
                <br />
                アンケートにもご協力ください。
              </>
            ) : (
              'もしよろしければ、アンケートにもご協力ください。'
            )}
          </p>
        </div>
        <div style={{ display: 'block', width: '100%', marginTop: '1rem' }}>
          <CustomButton color="customGray" width={{ xs: '100%', sm: '255px' }} variant="contained">
            アンケートはこちら
          </CustomButton>
        </div>
      </MessageBoard>
    </MainContainer>
  );
}
