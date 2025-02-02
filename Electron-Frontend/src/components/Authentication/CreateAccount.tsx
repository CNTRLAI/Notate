import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useView } from "@/context/useView";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSysSettings } from "@/context/useSysSettings";
import { useUser } from "@/context/useUser";

export default function CreateAccount() {
  const { setActiveView } = useView();
  const { users, setUsers } = useSysSettings();
  const { setActiveUser } = useUser();
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: "Welcome to Notate", subtitle: null },
    { title: "Your Research Hack Tool", subtitle: null },
    {
      title: "Create Account",
      subtitle: "Enter your name to create an account",
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prevStep) => prevStep + 1);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length]);

  const handleCreateAccount = async () => {
    if (!accountName.trim()) {
      setError("Please enter a name");
      return;
    }

    try {
      const user = await window.electron.addUser(accountName);
      if (user.error) {
        setError(user.error);
        return;
      }
      const allUsers = (await window.electron.getUsers()).users;
      const activeUser = allUsers.find((u) => u.name === user.name);
      if (activeUser) {
        setActiveUser(activeUser);
        setUsers(allUsers);
        setActiveView("Chat");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } catch (err) {
      setError("Failed to create account. Please try again.");
      console.error(err);
    }
  };

  const handleBack = () => setActiveView("SelectAccount");

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <AnimatePresence mode="wait">
        <motion.div key={currentStep} {...fadeInUp} className="text-center">
          {currentStep < 2 ? (
            <>
              <h1 className="text-5xl font-bold mb-6">
                {steps[currentStep].title}
              </h1>
              {steps[currentStep].subtitle && (
                <p className="text-3xl mb-8">{steps[currentStep].subtitle}</p>
              )}
            </>
          ) : (
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription className="text-center">
                  {steps[currentStep].subtitle}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <Button
                  className="w-full"
                  type="submit"
                  onClick={handleCreateAccount}
                >
                  Create Account
                </Button>
              </CardContent>
              {users.length > 0 && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleBack}
                  >
                    Back to Select Account
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
