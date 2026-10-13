import AppModal from "./Common/Components/AppModal/AppModal";
import Wallpaper from "./Common/Components/Wallpaper/Wallpaper";
import Header from "./Modules/Header/Header";
import Footer from "./Modules/Footer/Footer";

function Shell() {
  return (
    <>
      <Wallpaper />
      <Header />
      {/* <NotFound /> */}
      <Footer />
      <AppModal />
    </>
  );
}

export default function App() {
  return (
    <>
      <Shell />
    </>
  );
}
