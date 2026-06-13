import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import ForgetPassword from './ForgetPassword';
import VerifyOTP from './VerifyOTP';
import ResetPassword from './ResetPassword';

type FlowStep = 'forget' | 'verify' | 'reset' | 'success';

export default function PasswordResetFlow() {
  const [step, setStep] = useState<FlowStep>('forget');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleForgetSuccess = (userEmail: string) => {
    setEmail(userEmail);
    setStep('verify');
  };

  const handleVerifySuccess = (verifiedOtp: string) => {
    setOtp(verifiedOtp);
    setStep('reset');
  };

  const handleResetSuccess = () => {
    setStep('success');
  };

  if (step === 'success') {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      {step === 'forget' && (
        <ForgetPassword
          onBack={() => window.location.href = '/auth'}
          onSuccess={handleForgetSuccess}
        />
      )}
      {step === 'verify' && (
        <VerifyOTP
          email={email}
          onBack={() => setStep('forget')}
          onSuccess={handleVerifySuccess}
        />
      )}
      {step === 'reset' && (
        <ResetPassword
          email={email}
          otp={otp}
          onBack={() => setStep('verify')}
          onSuccess={handleResetSuccess}
        />
      )}
    </>
  );
}
