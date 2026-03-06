import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Lock, Sparkles, ArrowRight, BookOpen } from "lucide-react";
import logo from "@/assets/logo.png";

const ServantExpired = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-20">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <img src={logo} alt="Serenity Scrolls" className="h-16 w-auto" />
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                <Lock className="w-8 h-8 text-amber-600" />
                            </div>
                            <CardTitle>Your Free Trial Has Ended</CardTitle>
                            <CardDescription>
                                Your 30-day free access to Serenity Scrolls Servant has expired.
                                Subscribe to continue your spiritual reflection journey.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* What you had access to */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                <h3 className="font-semibold text-sm">What you'll get with a subscription:</h3>
                                <ul className="text-sm text-muted-foreground space-y-2">
                                    <li className="flex items-start gap-2">
                                        <BookOpen className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                        <span><strong>Servant 1.0</strong> — Scripture Snapshots, reflections, journal prompts, and daily guidance</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Sparkles className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                                        <span><strong>Servant+ 2.0</strong> — EQ-informed reflections, virtue mapping, and the Serenity Leadership Framework</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Pricing */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                                    Continue your journey
                                </p>
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className="text-sm text-muted-foreground line-through">$39.99</span>
                                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">$19.99</span>
                                    <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded-full font-medium">/mo</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Cancel anytime</p>
                            </div>

                            {/* Subscribe Button — routes to test flow upgrade simulation */}
                            <Button
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                size="lg"
                                onClick={() => navigate("/servant-test-flow")}
                            >
                                Subscribe Now <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>

                            <div className="text-center space-y-2">
                                <p className="text-xs text-muted-foreground">or</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/unlock")}
                                >
                                    Enter a New Order ID
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground text-center mt-4">
                        Questions? <a href="mailto:support@serenityscrolls.com" className="underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ServantExpired;
