import OverlayRecommendedBox from "@/shared/components/overlay/Box";
import SideBar from "@/shared/components/write/sideBar/SideBar";

const IndexPage = () => {
  const login = async () => {
    try {
      window.open(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        "_blank",
        "popup,width=800,height=600"
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <>
      <button onClick={() => login()}>로그인</button>
      <SideBar />
      <OverlayRecommendedBox refineWord={"따자하오"} />
    </>
  );
};

export default IndexPage;
