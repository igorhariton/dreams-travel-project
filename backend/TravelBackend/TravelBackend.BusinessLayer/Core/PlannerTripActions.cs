using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.PlannerTrip;
using TravelBackend.Domain.Models.PlannerTrip;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Core
{
    public class PlannerTripActions
    {
        protected PlannerTripActions()
        {
        }

        protected List<PlannerTripDto> GetAllPlannerTripsActionExecution()
        {
            var data = new List<PlannerTripDto>();
            List<PlannerTripData> tripData;

            using (var db = new TravelContext())
            {
                tripData = db.PlannerTrips.Where(x => !x.IsDeleted).ToList();
            }

            if (tripData.Count <= 0) return data;
            foreach (var item in tripData)
            {
                data.Add(new PlannerTripDto
                {
                    Id = item.Id,
                    UserId = item.UserId,
                    DestinationId = item.DestinationId,
                    Title = item.Title,
                    StartDate = item.StartDate,
                    EndDate = item.EndDate,
                    Notes = item.Notes
                });
            }

            return data;
        }

        protected PlannerTripDto? GetPlannerTripByIdActionExecution(int id)
        {
            PlannerTripData? tripData;
            using (var db = new TravelContext())
            {
                tripData = db.PlannerTrips.FirstOrDefault(x =>
                    x.Id == id && !x.IsDeleted);
            }

            if (tripData == null) return null;
            return new PlannerTripDto
            {
                Id = tripData.Id,
                UserId = tripData.UserId,
                DestinationId = tripData.DestinationId,
                Title = tripData.Title,
                StartDate = tripData.StartDate,
                EndDate = tripData.EndDate,
                Notes = tripData.Notes
            };
        }

        protected ActionResponce CreatePlannerTripActionExecution(PlannerTripDto data)
        {
            if (data.EndDate < data.StartDate)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "End date must be after start date."
                };
            }

            using (var db = new TravelContext())
            {
                var tripData = new PlannerTripData
                {
                    UserId = data.UserId,
                    DestinationId = data.DestinationId,
                    Title = data.Title,
                    StartDate = data.StartDate,
                    EndDate = data.EndDate,
                    Notes = data.Notes,
                    CreatedAt = DateTime.Now
                };
                db.PlannerTrips.Add(tripData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Planner trip created successfully."
            };
        }

        protected ActionResponce UpdatePlannerTripActionExecution(PlannerTripDto data)
        {
            var localData = GetPlannerTripByIdInternal(data.Id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Planner trip not found."
                };
            }

            localData.UserId = data.UserId;
            localData.DestinationId = data.DestinationId;
            localData.Title = data.Title;
            localData.StartDate = data.StartDate;
            localData.EndDate = data.EndDate;
            localData.Notes = data.Notes;
            localData.UpdatedAt = DateTime.Now;

            using (var db = new TravelContext())
            {
                db.PlannerTrips.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Planner trip updated successfully."
            };
        }

        protected ActionResponce DeletePlannerTripActionExecution(int id)
        {
            var localData = GetPlannerTripByIdInternal(id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Planner trip not found."
                };
            }

            localData.IsDeleted = true;

            using (var db = new TravelContext())
            {
                db.PlannerTrips.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Planner trip deleted."
            };
        }

        private PlannerTripData? GetPlannerTripByIdInternal(int id)
        {
            PlannerTripData? localData;
            using (var db = new TravelContext())
            {
                localData = db.PlannerTrips.FirstOrDefault(x => x.Id == id);
            }

            return localData;
        }
    }
}
