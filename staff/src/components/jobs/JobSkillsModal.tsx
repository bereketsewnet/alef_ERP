import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, X } from "lucide-react"
import { useJob, useAddJobSkill, useRemoveJobSkill } from "@/services/useJobs"
import { toast } from "sonner"

interface JobSkillsModalProps {
    jobId: number | null
    jobName: string
    open: boolean
    onClose: () => void
}

export function JobSkillsModal({ jobId, jobName, open, onClose }: JobSkillsModalProps) {
    const [newSkillName, setNewSkillName] = useState("")
    const [isRequired, setIsRequired] = useState(false)

    const { data: job, isLoading } = useJob(jobId || 0)
    const addSkill = useAddJobSkill()
    const removeSkill = useRemoveJobSkill()

    const handleAddSkill = (e: React.FormEvent) => {
        e.preventDefault()
        if (!jobId || !newSkillName.trim()) return

        addSkill.mutate(
            {
                jobId,
                data: {
                    skill_name: newSkillName.trim(),
                    is_required: isRequired
                }
            },
            {
                onSuccess: () => {
                    setNewSkillName("")
                    setIsRequired(false)
                }
            }
        )
    }

    const handleRemoveSkill = (skillId: number) => {
        if (!jobId) return
        if (confirm("Are you sure you want to remove this skill?")) {
            removeSkill.mutate({ jobId, skillId })
        }
    }

    if (!jobId) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Skills: {jobName}</DialogTitle>
                    <DialogDescription>
                        Add or remove skills required for this job role.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add Skill Form */}
                    <form onSubmit={handleAddSkill} className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                        <div className="space-y-2">
                            <Label htmlFor="skillName">New Skill Name</Label>
                            <Input
                                id="skillName"
                                placeholder="e.g. First Aid Certification"
                                value={newSkillName}
                                onChange={(e) => setNewSkillName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="required"
                                checked={isRequired}
                                onCheckedChange={(checked) => setIsRequired(checked as boolean)}
                            />
                            <Label htmlFor="required" className="cursor-pointer">
                                Mandatory Skill
                            </Label>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={!newSkillName.trim() || addSkill.isPending}
                        >
                            {addSkill.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            Add Skill
                        </Button>
                    </form>

                    {/* Skills List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Current Skills</h4>
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : !job?.skills || job.skills.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">
                                No skills defined for this job yet.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {job.skills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{skill.skill_name}</span>
                                            {skill.is_required && (
                                                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                                    Required
                                                </Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveSkill(skill.id)}
                                            disabled={removeSkill.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
