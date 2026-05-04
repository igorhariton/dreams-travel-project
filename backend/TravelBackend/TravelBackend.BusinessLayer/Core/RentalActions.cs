using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.Rental;
using TravelBackend.Domain.Models.Rental;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Core
{
    public class RentalActions
    {
        protected RentalActions()
        {
        }

        protected List<RentalDto> GetAllRentalsActionExecution()
        {
            var data = new List<RentalDto>();
            List<RentalData> rentalData;

            using (var db = new TravelContext())
            {
                rentalData = db.Rentals.Where(x => !x.IsDeleted).ToList();
            }

            if (rentalData.Count <= 0) return data;
            foreach (var item in rentalData)
            {
                data.Add(new RentalDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    RentalType = item.RentalType,
                    Description = item.Description,
                    DestinationId = item.DestinationId,
                    PricePerDay = item.PricePerDay,
                    ImageUrl = item.ImageUrl
                });
            }

            return data;
        }

        protected RentalDto? GetRentalByIdActionExecution(int id)
        {
            RentalData? rentalData;
            using (var db = new TravelContext())
            {
                rentalData = db.Rentals.FirstOrDefault(x =>
                    x.Id == id && !x.IsDeleted);
            }

            if (rentalData == null) return null;
            return new RentalDto
            {
                Id = rentalData.Id,
                Name = rentalData.Name,
                RentalType = rentalData.RentalType,
                Description = rentalData.Description,
                DestinationId = rentalData.DestinationId,
                PricePerDay = rentalData.PricePerDay,
                ImageUrl = rentalData.ImageUrl
            };
        }

        protected ActionResponce CreateRentalActionExecution(RentalDto data)
        {
            using (var db = new TravelContext())
            {
                var rentalData = new RentalData
                {
                    Name = data.Name,
                    RentalType = data.RentalType,
                    Description = data.Description,
                    DestinationId = data.DestinationId,
                    PricePerDay = data.PricePerDay,
                    ImageUrl = data.ImageUrl,
                    CreatedAt = DateTime.UtcNow
                };
                db.Rentals.Add(rentalData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Rental created successfully."
            };
        }

        protected ActionResponce UpdateRentalActionExecution(RentalDto data)
        {
            var localData = GetRentalByIdInternal(data.Id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Rental not found."
                };
            }

            localData.Name = data.Name;
            localData.RentalType = data.RentalType;
            localData.Description = data.Description;
            localData.DestinationId = data.DestinationId;
            localData.PricePerDay = data.PricePerDay;
            localData.ImageUrl = data.ImageUrl;
            localData.UpdatedAt = DateTime.UtcNow;

            using (var db = new TravelContext())
            {
                db.Rentals.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Rental updated successfully."
            };
        }

        protected ActionResponce DeleteRentalActionExecution(int id)
        {
            var localData = GetRentalByIdInternal(id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Rental not found."
                };
            }

            localData.IsDeleted = true;

            using (var db = new TravelContext())
            {
                db.Rentals.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Rental deleted."
            };
        }

        private RentalData? GetRentalByIdInternal(int id)
        {
            RentalData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Rentals.FirstOrDefault(x => x.Id == id);
            }

            return localData;
        }
    }
}
