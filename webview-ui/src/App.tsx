import "./App.css";
import Chatbox from "./components/chat/chat";
import ModelBar from "./components/models/models";

function App() {
  return (
    <div className="container">
      <div className="top">
        <ModelBar/>
      </div>
      <div className="center"></div>
      <div className="bottom">
        <Chatbox/>
      </div>
    </div>
  );
}

export default App;
