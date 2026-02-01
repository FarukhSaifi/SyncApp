import React, { useState } from "react";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import Input from "../components/ui/Input";
import { BUTTON_VARIANTS, ROUTES, SYNC_LABEL } from "../constants";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate(ROUTES.DASHBOARD);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(SYNC_LABEL.UNEXPECTED_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{SYNC_LABEL.WELCOME_BACK}</h1>
          <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground">{SYNC_LABEL.SIGN_IN_DESCRIPTION}</p>
        </div>

        <Card className="shadow-sm border rounded-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{SYNC_LABEL.SIGN_IN}</CardTitle>
            <CardDescription>{SYNC_LABEL.SIGN_IN_DESCRIPTION_2}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label={SYNC_LABEL.EMAIL_LABEL}
                required
                leftIcon={<FiMail className="h-5 w-5" />}
                value={formData.email}
                onChange={handleInputChange}
                placeholder={SYNC_LABEL.PLACEHOLDER_EMAIL}
                autoComplete="email"
              />

              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                label={SYNC_LABEL.LABEL_PASSWORD}
                required
                leftIcon={<FiLock className="h-5 w-5" />}
                rightIcon={showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                value={formData.password}
                onChange={handleInputChange}
                placeholder={SYNC_LABEL.PLACEHOLDER_NEW_PASSWORD}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant={BUTTON_VARIANTS.PRIMARY}
                className="w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  SYNC_LABEL.SIGNING_IN
                ) : (
                  <>
                    <span>{SYNC_LABEL.SIGN_IN}</span>
                    <FiArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {SYNC_LABEL.DONT_HAVE_ACCOUNT}{" "}
                <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:text-primary/90 transition-colors">
                  {SYNC_LABEL.SIGN_UP_HERE}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>{SYNC_LABEL.COPYRIGHT}</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
