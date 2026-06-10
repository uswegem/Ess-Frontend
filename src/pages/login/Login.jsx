import "./login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import { LoginPaper } from "../../components/Styles";
import API, { BASE_URL } from "../../Api";
import { postRequest } from "../../ApiFunction";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUser } from "../../slice/userInfo";

export default function Login() {

  const navigate = useNavigate();
  const [view, setView] = useState(false);
  const dispatch = useDispatch()

  const [obj, setObj] = useState({
    username: "",
    password: "",
  });

  const handleKeyDown = (e) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };
  const handleView = () => {
    setView(!view);
  };




  const inputEvent = (e) => {
    setObj({
      ...obj,
      [e.target.name]: e.target.value,
    });
  };



  // const submitForm = async (event) => {
  //   event.preventDefault();
  //   try {
  //     localStorage.setItem("adminToken", "loggedin");
  //     navigate("/dashboard")
  //     return
  //     const result = await postRequest(`${API.LOGIN}`, obj);
  //     // if (!result.data.status) {
  //     //   await delay(1000);
  //     //   toast.error(result.data.message);
  //     // } else {
  //     //   setToken(result.data.token);
  //     //   getCounts();
  //     //   setLoad(false);
  //     //   localStorage.setItem("adminToken", result.data.token);
  //     //   toast.success("Logged In successfully!");
  //     //   localStorage.setItem("user", JSON.stringify(result.data.data));
  //     //   dispatch(setUser(result.data.data));
  //     //   await delay(1000);
  //     //   setLoad(false);
  //     //   navigate("/dashboard");
  //     // }

  //     // if (!result.data.status) {
  //     //   if (result.data.code === 201) {
  //     //     toast.error(result.data.message);
  //     //     setLoader(false);
  //     //   }
  //     // } else {
  //     //   toast.success("Login successfully");
  //     //   localStorage.setItem("admintoken", result.data.token);
  //     // }
  //   } catch (err) {
  //     console.error(err.message);
  //   }
  // };


  const submitForm = async (event) => {
    event.preventDefault();
    const toastId = toast.loading("Authenticating...");

    try {
      const result = await postRequest(`${BASE_URL + API.LOGIN}`, obj);
      const { success, data, message } = result?.data;

      if (!success) {
        toast.error(message, { id: toastId, autoClose: 3000, });
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch(setUser(data.user));

      toast.success("Login successful!", { id: toastId, autoClose: 3000, });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message, { id: toastId, autoClose: 3000, });
      console.error(err.message);
    }
  };


  return (
    <>
      <div className="loginBg">
        <Container maxWidth="xs">
          <LoginPaper data-aos="zoom-in">
            <div className="row">
              <div className="col-xs-12 col-sm-12 col-md-12">
                <form onSubmit={submitForm} method="post">
                  <div className="login-page">
                    <div className="w-100 text-center">
                      <br />
                      <div className="fields">
                        <h4 className="w-100 text-center">MiraCore</h4>
                        <div className="logo mt-4" data-aos="fade-up">
                          {'Sign In to Administrator'}
                        </div>
                      </div>
                    </div>
                    <div className="fields">
                      <label>Email</label>
                      <input
                        required={true}
                        autoComplete='new-email'
                        type="username"
                        id="username"
                        name="username"
                        placeholder="username"
                        onChange={inputEvent}
                        onKeyDown={handleKeyDown}
                      />
                      <label>Password</label>
                      <div className="w-100 view">
                        <input
                          required={true}
                          type={view ? "text" : "password"}
                          autoComplete='new-password'
                          id="password"
                          name="password"
                          placeholder="********"
                          onChange={inputEvent}
                          onKeyDown={handleKeyDown}
                        />
                        <i
                          className={
                            !view ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                          }
                          onClick={handleView}
                        ></i>
                      </div>
                      <button className="custom-button w-100 mt-2">
                        Sign In
                        {/* {load ? "authenticating..." : "Sign In"} */}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </LoginPaper>
        </Container>
      </div>
    </>
  );
}
