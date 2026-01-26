import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface EmployeeCredentialsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    credentials: {
        username: string
        email: string
        password: string
        message: string
    }
}

export function EmployeeCredentialsModal({
    open,
    onOpenChange,
    credentials,
}: EmployeeCredentialsModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null)

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        toast.success(`${field} copied to clipboard`)
        setTimeout(() => setCopiedField(null), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Employee Login Credentials</DialogTitle>
                    <DialogDescription>
                        {credentials.message || "Please share these credentials with the employee. They should change their password on first login."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="flex gap-2 relative">
                            <Input
                                id="username"
                                value={credentials.username}
                                readOnly
                                className="font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    copyToClipboard(credentials.username, "Username")
                                }}
                                className="cursor-pointer relative z-10 flex-shrink-0"
                            >
                                {copiedField === "Username" ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex gap-2 relative">
                            <Input
                                id="email"
                                value={credentials.email}
                                readOnly
                                className="font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    copyToClipboard(credentials.email, "Email")
                                }}
                                className="cursor-pointer relative z-10 flex-shrink-0"
                            >
                                {copiedField === "Email" ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Initial Password</Label>
                        <div className="flex gap-2 relative">
                            <Input
                                id="password"
                                type="text"
                                value={credentials.password}
                                readOnly
                                className="font-mono font-bold text-lg"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    copyToClipboard(credentials.password, "Password")
                                }}
                                className="cursor-pointer relative z-10 flex-shrink-0"
                            >
                                {copiedField === "Password" ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-neutral-500">
                            Format: EmployeeCode-Last4DigitsOfPhone (e.g., EMP00001-5678)
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> Save these credentials securely. The password will not be shown again.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>
                        I've Saved the Credentials
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

