import { useEffect } from 'react';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';

import AboutPage from '../AboutPage/AboutPage';
import AdminPage from '../AdminPage/AdminPage';
import AppBarHeader from '../AppBarHeader/AppBarHeader';
import ContactPage from '../ContactPage/ContactPage';
import CostAndPricing from '../CostAndPricing/CostAndPricing';
import Homepage from '../Homepage/Homepage';
import LoginPage from '../LoginPage/LoginPage';
import RegisterPage from '../RegisterPage/RegisterPage';
import SideBar from '../SideBar/SideBar';
import WaitingPage from '../WaitingPage/WaitingPage';

import MyAccountPage from '../MyAccountPage/MyAccountPage';
import ToolThree from '../ToolThree/ToolThree';
import ToolTwo from '../ToolTwo/ToolTwo';
import './App.css';

function App() {
  const dispatch = useDispatch();

  const user = useSelector((store) => store.user.currentUser);

  useEffect(() => {
    dispatch({ type: 'FETCH_USER' });
  }, [dispatch]);

  return (
    <Router>
      <div>
        {/* <Nav /> */}
        <Switch>
          {/* Visiting localhost:5173 will redirect to localhost:5173/home */}
          <Redirect exact from="/" to="/home" />

          {/* Visiting localhost:5173/about will show the about page. */}
          <Route
            // shows AboutPage at all times (logged in or not)
            exact
            path="/about"
          >
            <AppBarHeader />
            <SideBar>
              <AboutPage />
            </SideBar>
          </Route>

          <Route exact path="/contact">
            <AppBarHeader />
            <SideBar>
              <ContactPage />
            </SideBar>
          </Route>

          <Route exact path="/waiting-page">
            <WaitingPage />
          </Route>

          {/* For protected routes, the view could show one of several things on the same route.
            Visiting localhost:5173/home will show the Homepage if the user is logged in.
            If the user is not logged in, the ProtectedRoute will show the LoginPage (component).
            Even though it seems like they are different pages, the user is always on localhost:5173/home */}

          {/* only admins can see Admin page; otherwise, user is redirected to /home */}
          <ProtectedRoute exact path="/admin">
            {user.is_admin ? (
              <>
                <AppBarHeader />
                <SideBar>
                  <AdminPage />
                </SideBar>
              </>
            ) : (
              <Redirect to="/home" />
            )}
          </ProtectedRoute>

          <ProtectedRoute exact path="/tool-two">
            <AppBarHeader />
            <SideBar>
              <ToolTwo />
            </SideBar>
          </ProtectedRoute>

          <ProtectedRoute exact path="/tool-three">
            <AppBarHeader />
            <SideBar>
              <ToolThree />
            </SideBar>
          </ProtectedRoute>

          <ProtectedRoute exact path="/cost-and-pricing">
            <AppBarHeader />
            <SideBar>
              <CostAndPricing />
            </SideBar>
          </ProtectedRoute>

          <ProtectedRoute exact path="/my-account-page">
            <AppBarHeader />
            <SideBar>
              <MyAccountPage />
            </SideBar>
          </ProtectedRoute>

          <Route exact path="/login">
            {/*
            If the user is already logged in,
            redirect to the /home page.
            Otherwise, show the login page
             */}
            {user.is_approved ? <Redirect to="/home" /> : <LoginPage />}
          </Route>

          <Route exact path="/registration">
            {/*
            If the user is already logged in,
            redirect them to the /home page.
            Otherwise, show the registration page
             */}
            {user.is_approved ? <Redirect to="/home" /> : <RegisterPage />}
          </Route>

          <ProtectedRoute exact path="/home">
            <AppBarHeader />
            <SideBar>
              <Homepage />
            </SideBar>
          </ProtectedRoute>

          {/* If none of the other routes matched, we will show a 404. */}
          <Route>
            <h1>404</h1>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
