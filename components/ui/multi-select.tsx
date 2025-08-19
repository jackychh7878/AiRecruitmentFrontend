import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const handleSelect = (selectedValue: string) => {
    const isSelected = value.includes(selectedValue)
    if (isSelected) {
      onChange(value.filter((v) => v !== selectedValue))
    } else {
      onChange([...value, selectedValue])
    }
  }

  const handleAddCustomValue = (customValue: string) => {
    const trimmedValue = customValue.trim()
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue])
      setInputValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      handleAddCustomValue(inputValue)
    }
  }

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter((v) => v !== valueToRemove))
  }

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal",
              value.length === 0 && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length === 0 ? (
                <span>{placeholder}</span>
              ) : value.length === 1 ? (
                <Badge variant="secondary" className="text-xs">
                  {options.find((option) => option.value === value[0])?.label || value[0]}
                </Badge>
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {options.find((option) => option.value === value[0])?.label || value[0]}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    +{value.length - 1} more
                  </Badge>
                </>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search options..."
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={handleKeyDown}
            />
            <CommandEmpty>
              {inputValue.trim() ? (
                <div className="py-2 px-2">
                  <button
                    className="w-full text-left text-sm hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-1"
                    onClick={() => handleAddCustomValue(inputValue)}
                  >
                    Add "{inputValue.trim()}"
                  </button>
                </div>
              ) : (
                "No options found."
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {/* Show option to add custom value if input doesn't match existing options */}
              {inputValue.trim() && 
               !filteredOptions.some(option => option.value.toLowerCase() === inputValue.toLowerCase()) &&
               !value.includes(inputValue.trim()) && (
                <CommandItem
                  value={inputValue}
                  onSelect={() => handleAddCustomValue(inputValue)}
                  className="text-blue-600"
                >
                  <div className="mr-2 h-4 w-4" />
                  Add "{inputValue.trim()}"
                </CommandItem>
              )}
              
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected items display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((selectedValue) => {
            const option = options.find((opt) => opt.value === selectedValue)
            return (
              <Badge
                key={selectedValue}
                variant="secondary"
                className="text-xs"
              >
                {option?.label || selectedValue}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRemove(selectedValue)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleRemove(selectedValue)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
} 