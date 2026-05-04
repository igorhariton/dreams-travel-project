using Microsoft.AspNetCore.Mvc;

namespace TravelBackend.Api.Controller
{
    [Route("api/translate")]
    [ApiController]
    public class TranslationController : ControllerBase
    {
        [HttpPost]
        public IActionResult Translate([FromBody] TranslationRequest request)
        {
            var text = (request.Text ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                return BadRequest(new { message = "Text is required." });
            }

            var target = NormalizeLanguage(request.Target);
            var translatedText = TranslateKnownPhrase(text, target) ?? text;

            return Ok(new
            {
                translatedText,
                text = translatedText,
                source = NormalizeLanguage(request.Source),
                target
            });
        }

        private static string NormalizeLanguage(string? language)
        {
            var normalized = (language ?? string.Empty).Trim().ToLowerInvariant();
            return normalized is "ro" or "ru" or "en" ? normalized : "en";
        }

        private static string? TranslateKnownPhrase(string text, string target)
        {
            if (target == "en") return text;

            var key = text.Trim().ToLowerInvariant();
            return target switch
            {
                "ro" => RomanianPhrases.TryGetValue(key, out var ro) ? ro : null,
                "ru" => RussianPhrases.TryGetValue(key, out var ru) ? ru : null,
                _ => null
            };
        }

        private static readonly Dictionary<string, string> RomanianPhrases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["approved."] = "Aprobat.",
            ["pending"] = "In asteptare",
            ["approved"] = "Aprobat",
            ["rejected"] = "Respins",
            ["draft"] = "Ciorna",
            ["payment"] = "Plata",
            ["cancellation"] = "Anulare",
            ["refund"] = "Rambursare",
            ["support"] = "Suport"
        };

        private static readonly Dictionary<string, string> RussianPhrases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["approved."] = "Одобрено.",
            ["pending"] = "Ожидает",
            ["approved"] = "Одобрено",
            ["rejected"] = "Отклонено",
            ["draft"] = "Черновик",
            ["payment"] = "Оплата",
            ["cancellation"] = "Отмена",
            ["refund"] = "Возврат",
            ["support"] = "Поддержка"
        };

        public class TranslationRequest
        {
            public string? Text { get; set; }
            public string? Source { get; set; }
            public string? Target { get; set; }
        }
    }
}
