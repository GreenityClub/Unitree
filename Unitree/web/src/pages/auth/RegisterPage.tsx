import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import apiClient, { API_ENDPOINTS } from '../../config/api';

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'verify' | 'complete'>('email');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
    verificationCode: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState<{ fullName: string; studentId: string } | null>(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVerificationForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.verificationCode) {
      newErrors.verificationCode = 'Verification code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;

    try {
      setIsLoading(true);
      // Send verification code to email
      await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: formData.email
      });
      
      // Fetch student info based on email
      const response = await apiClient.get(`/api/students?email=${encodeURIComponent(formData.email)}`);
      if (response.data.students && response.data.students.length > 0) {
        const student = response.data.students[0];
        setStudentInfo({
          fullName: student.full_name,
          studentId: student.student_id
        });
        setFormData(prev => ({
          ...prev,
          fullName: student.full_name,
          studentId: student.student_id
        }));
      }
      
      setStep('verify');
    } catch (error: any) {
      setErrors({ general: error.response?.data?.message || 'Failed to send verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateVerificationForm()) return;

    try {
      setIsLoading(true);
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        studentId: formData.studentId,
        verificationCode: formData.verificationCode,
      });
      setStep('complete');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h2>
          <p className="text-gray-600">
            Welcome to Unitree! You will be redirected to the dashboard shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <span className="text-4xl">🌱</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-500"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <Card>
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Send verification code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {studentInfo && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-sm text-green-800">
                    <strong>Student Information:</strong><br />
                    Name: {studentInfo.fullName}<br />
                    Student ID: {studentInfo.studentId}
                  </p>
                </div>
              )}

              <Input
                label="Verification Code"
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                error={errors.verificationCode}
                placeholder="Enter verification code"
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Create a password"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                placeholder="Confirm your password"
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Create account
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage; 