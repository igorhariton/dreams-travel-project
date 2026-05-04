using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using TravelBackend.DataAccess.Context;

namespace TravelBackend.Api.Controller
{
    [Route("api/assistant")]
    [ApiController]
    public class AssistantController : ControllerBase
    {
        private static readonly string[] SupportedIntents =
        {
            "destination_recommendation",
            "property_search",
            "rental_reservation",
            "host_contact",
            "visa_requirements",
            "budget_planning",
            "itinerary_suggestions",
            "faq_support",
            "general"
        };

        [HttpPost("chat")]
        public IActionResult Chat([FromBody] AssistantChatRequest request)
        {
            var message = (request.Message ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(message))
            {
                return BadRequest(new { message = "Message is required." });
            }

            var language = ResolveLanguage(request.Language, message);
            var catalog = BuildCatalog(request.Catalog);
            var context = request.Context ?? new AssistantContextDto();
            var intent = DetectIntent(message);
            var destinationId = FindDestinationId(message, context.LastDestinationId, catalog.Destinations);
            var budgetCap = ExtractBudget(message) ?? context.BudgetCap;
            var travelers = ExtractTravelers(message) ?? context.Travelers;

            var reply = BuildReply(language, intent, message, destinationId, budgetCap, travelers, context, catalog);
            return Ok(reply);
        }

        [HttpPost("booking-request")]
        public IActionResult BookingRequest([FromBody] BookingRequestDto request)
        {
            var language = ResolveLanguage(request.Language, null);
            return Ok(new
            {
                success = true,
                referenceId = CreateReference("BK"),
                message = language switch
                {
                    "ro" => "Cererea de rezervare a fost trimisa. Echipa TravelDreams va verifica disponibilitatea.",
                    "ru" => "Запрос на бронирование отправлен. Команда TravelDreams проверит доступность.",
                    _ => "Reservation request submitted. The TravelDreams team will verify availability."
                }
            });
        }

        [HttpPost("contact-host")]
        public IActionResult ContactHost([FromBody] ContactHostRequestDto request)
        {
            var language = ResolveLanguage(request.Language, null);
            return Ok(new
            {
                success = true,
                referenceId = CreateReference("HOST"),
                message = language switch
                {
                    "ro" => "Mesajul pentru gazda a fost trimis.",
                    "ru" => "Сообщение хозяину отправлено.",
                    _ => "Host contact request sent."
                }
            });
        }

        [HttpPost("support")]
        public IActionResult Support([FromBody] SupportRequestDto request)
        {
            var language = ResolveLanguage(request.Language, null);
            return Ok(new
            {
                success = true,
                referenceId = CreateReference("SUP"),
                message = language switch
                {
                    "ro" => "Cererea de suport a fost inregistrata.",
                    "ru" => "Запрос в поддержку зарегистрирован.",
                    _ => "Support request submitted."
                }
            });
        }

        private static AssistantReplyDto BuildReply(
            string language,
            string intent,
            string message,
            string? destinationId,
            decimal? budgetCap,
            int? travelers,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            return intent switch
            {
                "destination_recommendation" => BuildDestinationReply(language, destinationId, context, catalog),
                "property_search" => BuildHotelReply(language, destinationId, budgetCap, travelers, context, catalog),
                "rental_reservation" => BuildRentalReply(language, destinationId, budgetCap, travelers, context, catalog),
                "host_contact" => BuildHostContactReply(language, destinationId, budgetCap, travelers, context, catalog),
                "visa_requirements" => BuildVisaReply(language, destinationId, context, catalog),
                "budget_planning" => BuildBudgetReply(language, destinationId, budgetCap, travelers, context, catalog),
                "itinerary_suggestions" => BuildItineraryReply(language, destinationId, context, catalog),
                "faq_support" => BuildSupportReply(language, context),
                _ => BuildGeneralReply(language, message, destinationId, context, catalog)
            };
        }

        private static AssistantReplyDto BuildDestinationReply(
            string language,
            string? destinationId,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var recommendations = catalog.Destinations
                .OrderByDescending(x => x.Rating)
                .ThenByDescending(x => x.Reviews)
                .Take(3)
                .ToList();

            var text = language switch
            {
                "ro" => recommendations.Count > 0
                    ? $"Am gasit cateva destinatii bune:\n{NumberedDestinations(recommendations)}\n\nAlege una si iti arat cazari disponibile."
                    : "Spune-mi ce stil vrei: plaja, oras, romantica, aventura sau luxury, si iti recomand destinatii.",
                "ru" => recommendations.Count > 0
                    ? $"Я нашел подходящие направления:\n{NumberedDestinations(recommendations)}\n\nВыберите одно, и я покажу варианты проживания."
                    : "Напишите стиль поездки: море, город, романтика, приключения или luxury, и я подберу направления.",
                _ => recommendations.Count > 0
                    ? $"Here are strong destination matches:\n{NumberedDestinations(recommendations)}\n\nPick one and I can check stays."
                    : "Share your vibe: beach, city, romantic, adventure, or luxury, and I will recommend destinations."
            };

            var firstDestination = recommendations.FirstOrDefault();
            return Reply(
                text,
                "destination_recommendation",
                NextContext(context, "destination_recommendation", firstDestination?.Id ?? destinationId, null, null, null),
                new[]
                {
                    Action("check_availability", Label(language, "check_availability"), new() { ["destinationId"] = firstDestination?.Id }),
                    Action("plan_trip", Label(language, "plan_trip"), new() { ["destinationId"] = firstDestination?.Id }),
                    Action("search_hotels", Label(language, "search_hotels"), new() { ["destinationId"] = firstDestination?.Id })
                },
                Suggestions(language, "destination_recommendation"),
                recommendations.SelectMany(x => TopHotels(catalog, x.Id, null).Take(1)).ToList());
        }

        private static AssistantReplyDto BuildHotelReply(
            string language,
            string? destinationId,
            decimal? budgetCap,
            int? travelers,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var listings = TopHotels(catalog, destinationId, budgetCap).Take(4).ToList();
            var destination = FindDestination(catalog, destinationId);
            var destinationName = destination?.Name ?? Label(language, "selected_destination");
            var text = language switch
            {
                "ro" => listings.Count > 0
                    ? $"Am gasit {listings.Count} hoteluri pentru {destinationName}{BudgetText(language, budgetCap)}. Poti verifica disponibilitatea sau cere o oferta direct din chat."
                    : $"Nu am gasit hoteluri pentru {destinationName}{BudgetText(language, budgetCap)}. Pot largi cautarea sau pot verifica chirii.",
                "ru" => listings.Count > 0
                    ? $"Я нашел {listings.Count} отеля для {destinationName}{BudgetText(language, budgetCap)}. Можно проверить доступность или запросить цену прямо в чате."
                    : $"Не нашел отели для {destinationName}{BudgetText(language, budgetCap)}. Могу расширить поиск или проверить аренду.",
                _ => listings.Count > 0
                    ? $"I found {listings.Count} hotel options for {destinationName}{BudgetText(language, budgetCap)}. You can check availability or request a quote directly from chat."
                    : $"I could not find hotel matches for {destinationName}{BudgetText(language, budgetCap)}. I can widen the search or switch to rentals."
            };

            return Reply(
                text,
                "property_search",
                NextContext(context, "property_search", destinationId, "hotel", budgetCap, travelers),
                new[]
                {
                    Action("check_availability", Label(language, "check_availability"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("book_now", Label(language, "book_now"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("get_quote", Label(language, "get_quote"), new() { ["listingId"] = listings.FirstOrDefault()?.Id })
                },
                Suggestions(language, "property_search"),
                listings);
        }

        private static AssistantReplyDto BuildRentalReply(
            string language,
            string? destinationId,
            decimal? budgetCap,
            int? travelers,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var listings = TopRentals(catalog, destinationId, budgetCap).Take(4).ToList();
            var text = language switch
            {
                "ro" => listings.Count > 0
                    ? $"Am gasit {listings.Count} chirii potrivite. Pot deschide cererea de rezervare cu date, oaspeti si pret."
                    : "Nu am gasit chirii cu filtrele curente. Spune destinatia, datele si bugetul si rafinez cautarea.",
                "ru" => listings.Count > 0
                    ? $"Я нашел {listings.Count} вариантов аренды. Могу открыть запрос на бронирование с датами, гостями и ценой."
                    : "Не нашел аренду по текущим фильтрам. Напишите направление, даты и бюджет, и я уточню поиск.",
                _ => listings.Count > 0
                    ? $"I found {listings.Count} rentals that fit your request. I can open a reservation flow with dates, guests, and pricing."
                    : "I could not find a rental match with your current filters. Share destination, dates, and budget and I will refine it."
            };

            return Reply(
                text,
                "rental_reservation",
                NextContext(context, "rental_reservation", destinationId, "rental", budgetCap, travelers),
                new[]
                {
                    Action("check_availability", Label(language, "check_availability"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("book_now", Label(language, "book_now"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("contact_host", Label(language, "contact_host"), new() { ["listingId"] = listings.FirstOrDefault()?.Id })
                },
                Suggestions(language, "rental_reservation"),
                listings);
        }

        private static AssistantReplyDto BuildHostContactReply(
            string language,
            string? destinationId,
            decimal? budgetCap,
            int? travelers,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var listings = TopRentals(catalog, destinationId, budgetCap)
                .Concat(TopHotels(catalog, destinationId, budgetCap))
                .Take(4)
                .ToList();

            var text = language switch
            {
                "ro" => "Pot pregati un mesaj catre gazda sau echipa proprietatii. Alege o cazare si completeaza mesajul.",
                "ru" => "Я помогу отправить сообщение хозяину или команде объекта. Выберите жилье и заполните сообщение.",
                _ => "I can help you contact the host or property team. Pick a listing and I will prepare the request."
            };

            return Reply(
                text,
                "host_contact",
                NextContext(context, "host_contact", destinationId, null, budgetCap, travelers),
                new[]
                {
                    Action("contact_host", Label(language, "contact_host"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("check_availability", Label(language, "check_availability"), new() { ["listingId"] = listings.FirstOrDefault()?.Id })
                },
                Suggestions(language, "host_contact"),
                listings);
        }

        private static AssistantReplyDto BuildVisaReply(
            string language,
            string? destinationId,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var destination = FindDestination(catalog, destinationId);
            var destinationName = destination?.Name ?? Label(language, "destination");
            var text = language switch
            {
                "ro" => $"Pentru {destinationName}, cerintele de viza depind de pasaport, durata sederii si scopul calatoriei. Verifica mereu site-ul oficial al ambasadei sau al autoritatii de imigrari inainte de rezervare.",
                "ru" => $"Для {destinationName} визовые правила зависят от паспорта, срока пребывания и цели поездки. Перед бронированием всегда проверьте официальный сайт посольства или миграционной службы.",
                _ => $"For {destinationName}, visa requirements depend on passport, stay duration, and trip purpose. Always verify the official embassy or immigration website before booking."
            };

            return Reply(
                text,
                "visa_requirements",
                NextContext(context, "visa_requirements", destinationId, null, null, null),
                new[]
                {
                    Action("open_support", Label(language, "open_support")),
                    Action("plan_trip", Label(language, "plan_trip"), new() { ["destinationId"] = destinationId })
                },
                Suggestions(language, "visa_requirements"),
                destinationId == null ? new List<AssistantListingDto>() : TopHotels(catalog, destinationId, null).Take(3).ToList());
        }

        private static AssistantReplyDto BuildBudgetReply(
            string language,
            string? destinationId,
            decimal? budgetCap,
            int? travelers,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var listings = TopHotels(catalog, destinationId, budgetCap)
                .Concat(TopRentals(catalog, destinationId, budgetCap))
                .OrderBy(x => x.PricePerNight)
                .Take(4)
                .ToList();

            var average = listings.Count > 0 ? Math.Round(listings.Average(x => x.PricePerNight)) : 0;
            var estimate = average > 0 ? average * 4 + Math.Round(average * 4 * 0.35m) : 0;
            var text = language switch
            {
                "ro" => average > 0
                    ? $"Pe baza ofertelor gasite, bugetul realist este aproximativ ${average}/noapte. Pentru 4 nopti, estimeaza cam ${estimate} cu cheltuieli de baza incluse."
                    : "Spune-mi destinatia si bugetul maxim pe noapte si iti fac o estimare mai clara.",
                "ru" => average > 0
                    ? $"По найденным вариантам реалистичный бюджет около ${average} за ночь. На 4 ночи планируйте примерно ${estimate} с базовыми расходами."
                    : "Напишите направление и максимальный бюджет за ночь, и я сделаю точную оценку.",
                _ => average > 0
                    ? $"Based on current options, a realistic budget is around ${average}/night. For 4 nights, estimate about ${estimate} including basic extras."
                    : "Share your destination and max nightly budget, and I will generate a more precise estimate."
            };

            return Reply(
                text,
                "budget_planning",
                NextContext(context, "budget_planning", destinationId, null, budgetCap, travelers),
                new[]
                {
                    Action("get_quote", Label(language, "get_quote"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("check_availability", Label(language, "check_availability"), new() { ["listingId"] = listings.FirstOrDefault()?.Id }),
                    Action("plan_trip", Label(language, "plan_trip"), new() { ["destinationId"] = destinationId })
                },
                Suggestions(language, "budget_planning"),
                listings);
        }

        private static AssistantReplyDto BuildItineraryReply(
            string language,
            string? destinationId,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var destination = FindDestination(catalog, destinationId) ?? catalog.Destinations.FirstOrDefault();
            if (destination == null)
            {
                return BuildGeneralReply(language, string.Empty, destinationId, context, catalog);
            }

            var visits = destination.MustVisit.Count > 0 ? destination.MustVisit : new List<string> { destination.Name, destination.Country, "Local experiences" };
            var text = language switch
            {
                "ro" => $"Itinerar simplu pentru {destination.Name}:\nZiua 1: sosire + {visits.ElementAtOrDefault(0) ?? destination.Name}\nZiua 2: {visits.ElementAtOrDefault(1) ?? "atractii principale"} + experiente locale\nZiua 3: {visits.ElementAtOrDefault(2) ?? "relaxare"} + cina locala\n\nIl pot adapta dupa buget, ritm si tipul cazarii.",
                "ru" => $"Простой маршрут для {destination.Name}:\nДень 1: приезд + {visits.ElementAtOrDefault(0) ?? destination.Name}\nДень 2: {visits.ElementAtOrDefault(1) ?? "главные места"} + местные впечатления\nДень 3: {visits.ElementAtOrDefault(2) ?? "отдых"} + ужин\n\nМогу адаптировать под бюджет, темп и тип жилья.",
                _ => $"Simple itinerary for {destination.Name}:\nDay 1: arrival + {visits.ElementAtOrDefault(0) ?? destination.Name}\nDay 2: {visits.ElementAtOrDefault(1) ?? "main sights"} + local experiences\nDay 3: {visits.ElementAtOrDefault(2) ?? "relaxation"} + local dinner\n\nI can tailor it around budget, travel pace, and stay type."
            };

            return Reply(
                text,
                "itinerary_suggestions",
                NextContext(context, "itinerary_suggestions", destination.Id, null, null, null),
                new[]
                {
                    Action("plan_trip", Label(language, "plan_trip"), new() { ["destinationId"] = destination.Id }),
                    Action("book_now", Label(language, "book_now"), new() { ["destinationId"] = destination.Id }),
                    Action("check_availability", Label(language, "check_availability"), new() { ["destinationId"] = destination.Id })
                },
                Suggestions(language, "itinerary_suggestions"),
                TopHotels(catalog, destination.Id, null).Take(4).ToList());
        }

        private static AssistantReplyDto BuildSupportReply(string language, AssistantContextDto context)
        {
            var text = language switch
            {
                "ro" => "Pot deschide o cerere de suport pentru plata, anulare, rambursare, modificare rezervare sau contact gazda.",
                "ru" => "Я могу открыть запрос в поддержку по оплате, отмене, возврату, изменению бронирования или связи с хозяином.",
                _ => "I can open a support request for payment, cancellation, refund, booking changes, or host communication."
            };

            return Reply(
                text,
                "faq_support",
                NextContext(context, "faq_support", null, null, null, null),
                new[]
                {
                    Action("open_support", Label(language, "open_support")),
                    Action("contact_host", Label(language, "contact_host"))
                },
                Suggestions(language, "faq_support"),
                new List<AssistantListingDto>());
        }

        private static AssistantReplyDto BuildGeneralReply(
            string language,
            string message,
            string? destinationId,
            AssistantContextDto context,
            AssistantCatalog catalog)
        {
            var destination = FindDestination(catalog, destinationId);
            var text = language switch
            {
                "ro" => destination != null
                    ? $"Te pot ajuta cu {destination.Name}: caut cazari, estimez bugetul si fac un plan pe zile. Spune-mi datele, numarul de persoane sau bugetul."
                    : "Te pot ajuta sa gasesti destinatii, hoteluri, chirii, bugete, itinerare si cereri de rezervare. Spune-mi destinatia, datele, numarul de persoane sau bugetul.",
                "ru" => destination != null
                    ? $"Я помогу с {destination.Name}: найду жилье, оценю бюджет и составлю план по дням. Напишите даты, гостей или бюджет."
                    : "Я помогу найти направления, отели, аренду, бюджет, маршруты и запросы на бронирование. Напишите направление, даты, гостей или бюджет.",
                _ => destination != null
                    ? $"I can help with {destination.Name}: search stays, estimate budget, and build a day-by-day plan. Tell me dates, guest count, or budget."
                    : "I can help you find destinations, compare hotels and rentals, estimate budgets, build itineraries, and prepare booking requests. Tell me destination, dates, guest count, or budget."
            };

            return Reply(
                text,
                "general",
                NextContext(context, "general", destination?.Id ?? destinationId, null, null, null),
                new[]
                {
                    Action("search_hotels", Label(language, "search_hotels")),
                    Action("plan_trip", Label(language, "plan_trip")),
                    Action("open_support", Label(language, "open_support"))
                },
                Suggestions(language, "general"),
                destination != null ? TopHotels(catalog, destination.Id, null).Take(3).ToList() : TopHotels(catalog, null, null).Take(3).ToList());
        }

        private static AssistantReplyDto Reply(
            string text,
            string intent,
            AssistantContextDto context,
            IEnumerable<AssistantActionDto> actions,
            IEnumerable<string> suggestions,
            IEnumerable<AssistantListingDto> listings)
        {
            return new AssistantReplyDto
            {
                Text = text,
                Intent = intent,
                Context = context,
                Actions = actions.Where(x => x.Payload?.Values.Any(v => v is null) != true).ToList(),
                Suggestions = suggestions.Where(x => !string.IsNullOrWhiteSpace(x)).Take(6).ToList(),
                Listings = listings.ToList(),
                Source = "api"
            };
        }

        private static AssistantContextDto NextContext(
            AssistantContextDto previous,
            string intent,
            string? destinationId,
            string? listingType,
            decimal? budgetCap,
            int? travelers)
        {
            return new AssistantContextDto
            {
                LastIntent = intent,
                LastDestinationId = destinationId ?? previous.LastDestinationId,
                PreferredListingType = listingType ?? previous.PreferredListingType,
                BudgetCap = budgetCap ?? previous.BudgetCap,
                Travelers = travelers ?? previous.Travelers
            };
        }

        private static AssistantActionDto Action(string kind, string label, Dictionary<string, object?>? payload = null)
        {
            var id = $"{kind}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid():N}";

            return new AssistantActionDto
            {
                Id = id.Length > 48 ? id[..48] : id,
                Kind = kind,
                Label = label,
                Payload = payload
            };
        }

        private static List<AssistantListingDto> TopHotels(AssistantCatalog catalog, string? destinationId, decimal? budgetCap)
        {
            var query = catalog.Hotels.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(destinationId))
            {
                query = query.Where(x => string.Equals(x.DestinationId, destinationId, StringComparison.OrdinalIgnoreCase));
            }
            if (budgetCap.HasValue)
            {
                query = query.Where(x => x.PricePerNight <= budgetCap.Value);
            }

            return query
                .OrderByDescending(x => x.Rating)
                .ThenBy(x => x.PricePerNight)
                .Select(x => new AssistantListingDto
                {
                    Id = x.Id,
                    Type = "hotel",
                    DestinationId = x.DestinationId,
                    Title = x.Name,
                    Location = x.Location,
                    PricePerNight = x.PricePerNight,
                    Rating = x.Rating,
                    Image = x.Images.FirstOrDefault() ?? "/images/_site/hero-hotels.jpg",
                    Amenities = x.Amenities.Take(6).ToList(),
                    Summary = x.Description
                })
                .Take(6)
                .ToList();
        }

        private static List<AssistantListingDto> TopRentals(AssistantCatalog catalog, string? destinationId, decimal? budgetCap)
        {
            var query = catalog.Rentals.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(destinationId))
            {
                query = query.Where(x => string.Equals(x.DestinationId, destinationId, StringComparison.OrdinalIgnoreCase));
            }
            if (budgetCap.HasValue)
            {
                query = query.Where(x => x.PricePerNight <= budgetCap.Value);
            }

            return query
                .OrderByDescending(x => x.Rating)
                .ThenBy(x => x.PricePerNight)
                .Select(x => new AssistantListingDto
                {
                    Id = x.Id,
                    Type = "rental",
                    DestinationId = x.DestinationId,
                    Title = x.Name,
                    Location = x.Location,
                    PricePerNight = x.PricePerNight,
                    Rating = x.Rating,
                    Image = x.Images.FirstOrDefault() ?? "/images/_site/hero-rentals.jpg",
                    Amenities = x.Amenities.Take(6).ToList(),
                    Summary = x.Description
                })
                .Take(6)
                .ToList();
        }

        private static AssistantCatalog BuildCatalog(AssistantCatalogDto? requestCatalog)
        {
            var destinations = requestCatalog?.Destinations?.Where(IsValidDestination).Select(MapDestination).ToList() ?? new();
            var hotels = requestCatalog?.Hotels?.Where(IsValidHotel).Select(MapHotel).ToList() ?? new();
            var rentals = requestCatalog?.Rentals?.Where(IsValidRental).Select(MapRental).ToList() ?? new();

            if (destinations.Count == 0 || hotels.Count == 0 || rentals.Count == 0)
            {
                try
                {
                    using var db = new TravelContext();
                    if (destinations.Count == 0)
                    {
                        destinations = db.Destinations
                            .Where(x => !x.IsDeleted)
                            .ToList()
                            .Select(x => new DestinationItem
                            {
                                Id = x.Id.ToString(),
                                Name = x.Name,
                                Country = x.Country,
                                Description = x.Description,
                                Images = new List<string> { x.ImageUrl },
                                Rating = 4.5,
                                Reviews = 1,
                                MustVisit = new List<string> { x.Name }
                            })
                            .ToList();
                    }
                    if (hotels.Count == 0)
                    {
                        hotels = db.Hotels
                            .Where(x => !x.IsDeleted)
                            .ToList()
                            .Select(x => new HotelItem
                            {
                                Id = x.Id.ToString(),
                                Name = x.Name,
                                DestinationId = x.DestinationId.ToString(),
                                Location = x.Name,
                                Description = x.Description,
                                Images = new List<string> { x.ImageUrl },
                                Rating = x.Rating,
                                PricePerNight = x.PricePerNight,
                                Amenities = new List<string>()
                            })
                            .ToList();
                    }
                    if (rentals.Count == 0)
                    {
                        rentals = db.Rentals
                            .Where(x => !x.IsDeleted)
                            .ToList()
                            .Select(x => new RentalItem
                            {
                                Id = x.Id.ToString(),
                                Name = x.Name,
                                DestinationId = x.DestinationId.ToString(),
                                Location = x.Name,
                                Description = x.Description,
                                Images = new List<string> { x.ImageUrl },
                                Rating = 4.5,
                                PricePerNight = x.PricePerDay,
                                Amenities = new List<string> { x.RentalType }
                            })
                            .ToList();
                    }
                }
                catch
                {
                    // The frontend catalog remains enough for chat when the DB is not reachable.
                }
            }

            return new AssistantCatalog(destinations, hotels, rentals);
        }

        private static bool IsValidDestination(ClientDestinationDto item) => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name);
        private static bool IsValidHotel(ClientHotelDto item) => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name);
        private static bool IsValidRental(ClientRentalDto item) => !string.IsNullOrWhiteSpace(item.Id) && !string.IsNullOrWhiteSpace(item.Name);

        private static DestinationItem MapDestination(ClientDestinationDto item)
        {
            return new DestinationItem
            {
                Id = item.Id,
                Name = item.Name,
                Country = item.Country ?? string.Empty,
                Description = item.Description ?? string.Empty,
                Images = item.Images ?? new List<string>(),
                Rating = item.Rating,
                Reviews = item.Reviews,
                MustVisit = item.MustVisit ?? new List<string>()
            };
        }

        private static HotelItem MapHotel(ClientHotelDto item)
        {
            return new HotelItem
            {
                Id = item.Id,
                Name = item.Name,
                DestinationId = item.DestinationId ?? string.Empty,
                Location = item.Location ?? string.Empty,
                Description = item.Description ?? string.Empty,
                Images = item.Images ?? new List<string>(),
                Rating = item.Rating,
                PricePerNight = item.PricePerNight,
                Amenities = item.Amenities ?? new List<string>()
            };
        }

        private static RentalItem MapRental(ClientRentalDto item)
        {
            return new RentalItem
            {
                Id = item.Id,
                Name = item.Name,
                DestinationId = item.DestinationId ?? string.Empty,
                Location = item.Location ?? string.Empty,
                Description = item.Description ?? string.Empty,
                Images = item.Images ?? new List<string>(),
                Rating = item.Rating,
                PricePerNight = item.PricePerNight,
                Amenities = item.Amenities ?? new List<string>()
            };
        }

        private static string DetectIntent(string message)
        {
            var normalized = Normalize(message);
            if (ContainsAny(normalized, "chirie", "vila", "villa", "apartment", "apartament", "house", "rental", "arenda", "аренд", "вилл", "квартир", "дом"))
            {
                return "rental_reservation";
            }

            if (ContainsAny(normalized, "hotel", "hotels", "hoteluri", "cazare", "cazari", "camera", "room", "resort", "accommodation", "отел", "жилье", "номер", "курорт"))
            {
                return "property_search";
            }

            var candidates = new Dictionary<string, string[]>
            {
                ["visa_requirements"] = new[] { "visa", "entry", "passport", "requirements", "border", "immigration", "viza", "pasaport", "intrare", "cerinte", "виза", "паспорт", "въезд" },
                ["budget_planning"] = new[] { "budget", "cost", "cheap", "affordable", "price", "under", "quote", "estimate", "buget", "cost", "ieftin", "pret", "sub", "oferta", "бюджет", "стоимость", "дешев", "цена", "до" },
                ["itinerary_suggestions"] = new[] { "itinerary", "plan trip", "schedule", "day by day", "trip plan", "route", "itinerar", "planifica", "program", "traseu", "маршрут", "план", "по дням" },
                ["host_contact"] = new[] { "contact host", "message host", "reach host", "owner", "landlord", "host", "contact gazda", "mesaj gazda", "gazda", "связаться", "хозя", "владел" },
                ["rental_reservation"] = new[] { "reserve", "reservation", "book rental", "villa", "apartment", "house", "check in", "availability", "rezervare", "rezerva", "chirie", "vila", "apartament", "casa", "disponibil", "брони", "аренда", "вилла", "квартира", "дом", "доступ" },
                ["property_search"] = new[] { "hotel", "property", "stay", "room", "resort", "accommodation", "cazare", "camera", "отель", "жилье", "номер", "курорт" },
                ["destination_recommendation"] = new[] { "destination", "where to go", "recommend", "place", "beach", "city break", "romantic", "destinatie", "recomanda", "unde", "plaja", "romantic", "направление", "куда", "порекоменду", "море", "пляж", "роман" },
                ["faq_support"] = new[] { "help", "support", "problem", "issue", "refund", "cancel", "payment", "faq", "ajutor", "suport", "problema", "rambursare", "anulare", "plata", "помощ", "поддерж", "проблем", "возврат", "отмен", "оплат" }
            };

            var bestIntent = "general";
            var bestScore = 0;
            foreach (var item in candidates)
            {
                var score = item.Value.Count(term => normalized.Contains(Normalize(term), StringComparison.OrdinalIgnoreCase));
                if (score > bestScore)
                {
                    bestIntent = item.Key;
                    bestScore = score;
                }
            }

            return SupportedIntents.Contains(bestIntent) ? bestIntent : "general";
        }

        private static bool ContainsAny(string normalizedText, params string[] terms)
        {
            return terms.Any(term => normalizedText.Contains(Normalize(term), StringComparison.OrdinalIgnoreCase));
        }

        private static string? FindDestinationId(string message, string? fallback, IReadOnlyList<DestinationItem> destinations)
        {
            var normalized = Normalize(message);
            var match = destinations.FirstOrDefault(destination =>
                normalized.Contains(Normalize(destination.Name), StringComparison.OrdinalIgnoreCase) ||
                (!string.IsNullOrWhiteSpace(destination.Country) && normalized.Contains(Normalize(destination.Country), StringComparison.OrdinalIgnoreCase)) ||
                normalized.Contains(Normalize(destination.Id), StringComparison.OrdinalIgnoreCase));
            return match?.Id ?? fallback;
        }

        private static DestinationItem? FindDestination(AssistantCatalog catalog, string? destinationId)
        {
            if (string.IsNullOrWhiteSpace(destinationId)) return null;
            return catalog.Destinations.FirstOrDefault(x => string.Equals(x.Id, destinationId, StringComparison.OrdinalIgnoreCase));
        }

        private static decimal? ExtractBudget(string message)
        {
            var match = Regex.Match(message, @"(?:under|below|max|budget|sub|pana la|până la|buget|до|макс|бюджет)\s*\$?\s*(\d{2,5})|\$?\s*(\d{2,5})\s*(?:per night|night|usd|noapte|ноч|\$)", RegexOptions.IgnoreCase);
            var value = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
            return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed) && parsed >= 30 ? parsed : null;
        }

        private static int? ExtractTravelers(string message)
        {
            var match = Regex.Match(message, @"(\d+)\s*(?:guest|guests|people|persons|traveler|travelers|persoane|oameni|oaspeti|гост|человек)", RegexOptions.IgnoreCase);
            return int.TryParse(match.Groups[1].Value, out var parsed) && parsed > 0 ? parsed : null;
        }

        private static string ResolveLanguage(string? language, string? message)
        {
            var normalized = (language ?? string.Empty).Trim().ToLowerInvariant();
            if (normalized is "ro" or "ru" or "en") return normalized;
            if (!string.IsNullOrWhiteSpace(message) && Regex.IsMatch(message, @"\p{IsCyrillic}")) return "ru";
            return "en";
        }

        private static string Normalize(string value)
        {
            var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);
            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }
            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        private static string NumberedDestinations(IReadOnlyList<DestinationItem> destinations)
        {
            return string.Join("\n", destinations.Select((item, index) => $"{index + 1}. {item.Name}, {item.Country} ({item.Rating:0.0}★)"));
        }

        private static string BudgetText(string language, decimal? budget)
        {
            if (!budget.HasValue) return string.Empty;
            return language switch
            {
                "ro" => $" sub ${budget}/noapte",
                "ru" => $" до ${budget} за ночь",
                _ => $" under ${budget}/night"
            };
        }

        private static string Label(string language, string key)
        {
            return (language, key) switch
            {
                ("ro", "book_now") => "Rezerva",
                ("ro", "check_availability") => "Verifica disponibilitatea",
                ("ro", "contact_host") => "Contacteaza gazda",
                ("ro", "get_quote") => "Cere oferta",
                ("ro", "plan_trip") => "Planifica excursia",
                ("ro", "open_support") => "Suport clienti",
                ("ro", "search_hotels") => "Cauta hoteluri",
                ("ro", "selected_destination") => "destinatia aleasa",
                ("ro", "destination") => "destinatie",
                ("ru", "book_now") => "Забронировать",
                ("ru", "check_availability") => "Проверить доступность",
                ("ru", "contact_host") => "Связаться с хозяином",
                ("ru", "get_quote") => "Запросить цену",
                ("ru", "plan_trip") => "Спланировать поездку",
                ("ru", "open_support") => "Поддержка",
                ("ru", "search_hotels") => "Искать отели",
                ("ru", "selected_destination") => "выбранного направления",
                ("ru", "destination") => "направления",
                (_, "book_now") => "Book now",
                (_, "check_availability") => "Check availability",
                (_, "contact_host") => "Contact host",
                (_, "get_quote") => "Get quote",
                (_, "plan_trip") => "Plan my trip",
                (_, "open_support") => "Customer support",
                (_, "search_hotels") => "Search hotels",
                (_, "selected_destination") => "your destination",
                (_, "destination") => "destination",
                _ => key
            };
        }

        private static IReadOnlyList<string> Suggestions(string language, string intent)
        {
            return (language, intent) switch
            {
                ("ro", "destination_recommendation") => new[] { "Arata optiuni luxury acolo", "Exista cazari pentru familie?", "Care este cel mai bun sezon?" },
                ("ro", "property_search") => new[] { "Arata hoteluri boutique", "Vreau piscina si spa", "Mai aproape de centru" },
                ("ro", "rental_reservation") => new[] { "Arata vile cu piscina privata", "Vreau chirie pet-friendly", "Doar optiuni cu 2 dormitoare" },
                ("ro", "host_contact") => new[] { "Intreaba despre check-in devreme", "Intreaba despre transfer aeroport", "Intreaba despre anulare flexibila" },
                ("ro", "visa_requirements") => new[] { "Ce documente trebuie sa am?", "Cand trebuie sa aplic?", "Am nevoie de asigurare?" },
                ("ro", "budget_planning") => new[] { "Sub $250/noapte", "Compara hoteluri cu chirii", "Arata cel mai bun raport pret/calitate" },
                ("ro", "itinerary_suggestions") => new[] { "Fa-l mai luxury", "Fa-l pentru familie", "Adauga mancare si nightlife" },
                ("ro", "faq_support") => new[] { "Am problema cu plata", "Vreau anulare", "Vreau sa contactez gazda" },
                ("ro", _) => new[] { "Cauta hoteluri in Paris", "Planifica 4 zile in Bali", "Arata chirii sub $250" },
                ("ru", "destination_recommendation") => new[] { "Покажи luxury варианты", "Есть семейные варианты?", "Когда лучший сезон?" },
                ("ru", "property_search") => new[] { "Покажи boutique отели", "Нужен бассейн и spa", "Ближе к центру" },
                ("ru", "rental_reservation") => new[] { "Покажи виллы с бассейном", "Нужна pet-friendly аренда", "Только 2 спальни" },
                ("ru", "host_contact") => new[] { "Спросить про ранний check-in", "Спросить про трансфер", "Спросить про гибкую отмену" },
                ("ru", "visa_requirements") => new[] { "Какие документы нужны?", "Когда подавать заявку?", "Нужна страховка?" },
                ("ru", "budget_planning") => new[] { "До $250 за ночь", "Сравни отели и аренду", "Покажи лучший value" },
                ("ru", "itinerary_suggestions") => new[] { "Сделай luxury маршрут", "Сделай семейный маршрут", "Добавь еду и nightlife" },
                ("ru", "faq_support") => new[] { "Проблема с оплатой", "Нужна отмена", "Связаться с хозяином" },
                ("ru", _) => new[] { "Искать отели в Paris", "План на 4 дня в Bali", "Показать аренду до $250" },
                (_, "destination_recommendation") => new[] { "Show luxury options there", "Any family-friendly stays?", "What is the best season?" },
                (_, "property_search") => new[] { "Show boutique hotels", "Show options with pool and spa", "Closer to city center" },
                (_, "rental_reservation") => new[] { "Show villas with private pool", "Need pet-friendly rental", "2-bedroom options only" },
                (_, "host_contact") => new[] { "Ask about early check-in", "Ask about airport transfer", "Ask about cancellation flexibility" },
                (_, "visa_requirements") => new[] { "What documents should I carry?", "How early should I apply?", "Do I need travel insurance?" },
                (_, "budget_planning") => new[] { "Keep it under $250/night", "Compare hotels vs rentals", "Show best value properties" },
                (_, "itinerary_suggestions") => new[] { "Make it luxury-focused", "Make it family-friendly", "Add food and nightlife stops" },
                (_, "faq_support") => new[] { "I need help with a payment issue", "I need cancellation support", "I need help contacting a host" },
                _ => new[] { "Find hotels in Paris", "Plan 4 days in Bali", "Show rentals under $250" }
            };
        }

        private static string CreateReference(string prefix)
        {
            return $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
        }

        public class AssistantChatRequest
        {
            public string? SessionId { get; set; }
            public string? Message { get; set; }
            public List<ChatHistoryItem> History { get; set; } = new();
            public AssistantContextDto? Context { get; set; }
            public string? Language { get; set; }
            public AssistantCatalogDto? Catalog { get; set; }
        }

        public class ChatHistoryItem
        {
            public string Role { get; set; } = string.Empty;
            public string Text { get; set; } = string.Empty;
        }

        public class AssistantContextDto
        {
            public string LastIntent { get; set; } = "general";
            public string? LastDestinationId { get; set; }
            public string? PreferredListingType { get; set; }
            public decimal? BudgetCap { get; set; }
            public int? Travelers { get; set; }
        }

        public class AssistantCatalogDto
        {
            public List<ClientDestinationDto> Destinations { get; set; } = new();
            public List<ClientHotelDto> Hotels { get; set; } = new();
            public List<ClientRentalDto> Rentals { get; set; } = new();
        }

        public class ClientDestinationDto
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string? Country { get; set; }
            public string? Description { get; set; }
            public List<string>? Images { get; set; }
            public double Rating { get; set; }
            public int Reviews { get; set; }
            public List<string>? MustVisit { get; set; }
        }

        public class ClientHotelDto
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string? DestinationId { get; set; }
            public string? Location { get; set; }
            public List<string>? Images { get; set; }
            public double Rating { get; set; }
            public decimal PricePerNight { get; set; }
            public string? Description { get; set; }
            public List<string>? Amenities { get; set; }
        }

        public class ClientRentalDto : ClientHotelDto
        {
        }

        private record AssistantCatalog(
            List<DestinationItem> Destinations,
            List<HotelItem> Hotels,
            List<RentalItem> Rentals);

        private class DestinationItem
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Country { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public List<string> Images { get; set; } = new();
            public double Rating { get; set; }
            public int Reviews { get; set; }
            public List<string> MustVisit { get; set; } = new();
        }

        private class HotelItem
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string DestinationId { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public List<string> Images { get; set; } = new();
            public double Rating { get; set; }
            public decimal PricePerNight { get; set; }
            public List<string> Amenities { get; set; } = new();
        }

        private class RentalItem : HotelItem
        {
        }

        public class AssistantReplyDto
        {
            public string Text { get; set; } = string.Empty;
            public string Intent { get; set; } = "general";
            public AssistantContextDto Context { get; set; } = new();
            public List<AssistantActionDto> Actions { get; set; } = new();
            public List<string> Suggestions { get; set; } = new();
            public List<AssistantListingDto> Listings { get; set; } = new();
            public string Source { get; set; } = "api";
        }

        public class AssistantActionDto
        {
            public string Id { get; set; } = string.Empty;
            public string Label { get; set; } = string.Empty;
            public string Kind { get; set; } = string.Empty;
            public Dictionary<string, object?>? Payload { get; set; }
        }

        public class AssistantListingDto
        {
            public string Id { get; set; } = string.Empty;
            public string Type { get; set; } = "hotel";
            public string DestinationId { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string Location { get; set; } = string.Empty;
            public decimal PricePerNight { get; set; }
            public double Rating { get; set; }
            public string Image { get; set; } = string.Empty;
            public List<string> Amenities { get; set; } = new();
            public string Summary { get; set; } = string.Empty;
        }

        public class BookingRequestDto
        {
            public string? SessionId { get; set; }
            public string? ListingId { get; set; }
            public string? CheckIn { get; set; }
            public string? CheckOut { get; set; }
            public int Guests { get; set; }
            public decimal Total { get; set; }
            public string? Note { get; set; }
            public string? Language { get; set; }
        }

        public class ContactHostRequestDto
        {
            public string? SessionId { get; set; }
            public string? ListingId { get; set; }
            public string? Name { get; set; }
            public string? Email { get; set; }
            public string? Message { get; set; }
            public string? Language { get; set; }
        }

        public class SupportRequestDto
        {
            public string? SessionId { get; set; }
            public string? Topic { get; set; }
            public string? Name { get; set; }
            public string? Email { get; set; }
            public string? Message { get; set; }
            public string? Language { get; set; }
        }
    }
}
