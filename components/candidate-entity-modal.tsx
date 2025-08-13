import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguageCodes, useLanguageProficiencyCodes } from "@/hooks/use-lookup-codes"
import type { CareerHistory, Skills, Education, LicenseCertification, Language } from "@/lib/api"

interface CandidateEntityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any, isNew: boolean) => void
  type: 'career' | 'skill' | 'education' | 'certification' | 'language' | null
  item: any
  isNew: boolean
}

export function CandidateEntityModal({
  isOpen,
  onClose,
  onSave,
  type,
  item,
  isNew,
}: CandidateEntityModalProps) {
  const [formData, setFormData] = useState<any>({})
  const { codes: languageCodes } = useLanguageCodes()
  const { codes: proficiencyCodes } = useLanguageProficiencyCodes()

  const proficiencyLevels = [
    'BASIC',
    'INTERMEDIATE', 
    'ADVANCED',
    'FLUENT',
    'NATIVE'
  ]

  useEffect(() => {
    if (item) {
      setFormData(item)
    }
  }, [item])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(formData, isNew)
  }

  const getModalTitle = () => {
    if (!type) return ""
    const action = isNew ? "Add" : "Edit"
    switch (type) {
      case 'career':
        return `${action} Work Experience`
      case 'skill':
        return `${action} Skill`
      case 'education':
        return `${action} Education`
      case 'certification':
        return `${action} License/Certification`
      case 'language':
        return `${action} Language`
      default:
        return action
    }
  }

  const renderForm = () => {
    switch (type) {
      case 'career':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  value={formData.job_title || ""}
                  onChange={(e) => handleInputChange("job_title", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name || ""}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  placeholder="Leave empty if current"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                placeholder="Describe your role and achievements..."
              />
            </div>
          </div>
        )

      case 'skill':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="skills">Skill Name *</Label>
              <Input
                id="skills"
                value={formData.skills || ""}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="e.g., JavaScript, Project Management, etc."
                required
              />
            </div>
          </div>
        )

      case 'education':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="school">School/Institution *</Label>
              <Input
                id="school"
                value={formData.school || ""}
                onChange={(e) => handleInputChange("school", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  value={formData.degree || ""}
                  onChange={(e) => handleInputChange("degree", e.target.value)}
                  placeholder="e.g., Bachelor of Science"
                  required
                />
              </div>
              <div>
                <Label htmlFor="field_of_study">Field of Study</Label>
                <Input
                  id="field_of_study"
                  value={formData.field_of_study || ""}
                  onChange={(e) => handleInputChange("field_of_study", e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date || ""}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="grade">Grade/GPA</Label>
              <Input
                id="grade"
                value={formData.grade || ""}
                onChange={(e) => handleInputChange("grade", e.target.value)}
                placeholder="e.g., 3.8 GPA, First Class Honours"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
                placeholder="Additional details..."
              />
            </div>
          </div>
        )

      case 'certification':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="license_certification_name">Certification/License Name *</Label>
              <Input
                id="license_certification_name"
                value={formData.license_certification_name || ""}
                onChange={(e) => handleInputChange("license_certification_name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="issuing_organisation">Issuing Organization</Label>
              <Input
                id="issuing_organisation"
                value={formData.issuing_organisation || ""}
                onChange={(e) => handleInputChange("issuing_organisation", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={formData.issue_date || ""}
                  onChange={(e) => handleInputChange("issue_date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date || ""}
                  onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                  disabled={formData.is_no_expiry}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_no_expiry"
                checked={formData.is_no_expiry || false}
                onCheckedChange={(checked) => {
                  handleInputChange("is_no_expiry", checked)
                  if (checked) {
                    handleInputChange("expiry_date", "")
                  }
                }}
              />
              <Label htmlFor="is_no_expiry">No expiry date</Label>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
                placeholder="Additional details..."
              />
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="language">Language *</Label>
              <Select
                value={formData.language || ""}
                onValueChange={(value) => handleInputChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languageCodes.map((code) => (
                    <SelectItem key={code.id} value={code.com_code}>
                      {code.com_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="proficiency_level">Proficiency Level *</Label>
              <Select
                value={formData.proficiency_level || ""}
                onValueChange={(value) => handleInputChange("proficiency_level", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select proficiency level" />
                </SelectTrigger>
                <SelectContent>
                  {proficiencyLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {isNew ? "Add new information" : "Update existing information"}
          </DialogDescription>
        </DialogHeader>
        {renderForm()}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isNew ? "Add" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 