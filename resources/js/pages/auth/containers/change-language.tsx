import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/use-language";

export function ChangeLanguage() 
{
  const { language, availableLanguages, changeLanguage } = useLanguage();

  return (
    <Select value={language} onValueChange={changeLanguage}>
      <SelectTrigger wrapperClassName="w-fit h-6" className="w-fit h-6 p-1.5 pr-8" iconClassName="right-1.5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {
          availableLanguages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))
        }
      </SelectContent>
    </Select>
  )
}