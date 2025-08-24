import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface PasskeyAccessProps {
  onAuthenticated: () => void;
}

export const PasskeyAccess: React.FC<PasskeyAccessProps> = ({ onAuthenticated }) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey === '4467') {
      onAuthenticated();
    } else {
      setError('Invalid passkey. Please try again.');
      setPasskey('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Secure Access</CardTitle>
          <p className="text-muted-foreground">Enter passkey to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                value={passkey}
                onChange={(e) => {
                  setPasskey(e.target.value);
                  setError('');
                }}
                placeholder="Enter 4-digit passkey"
                maxLength={4}
                className="text-center text-lg tracking-widest"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Access Site
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};