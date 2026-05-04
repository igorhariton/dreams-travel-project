using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.Hotel;
using TravelBackend.Domain.Models.Hotel;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Core
{
    public class HotelActions
    {
        protected HotelActions()
        {
        }

        protected List<HotelDto> GetAllHotelsActionExecution()
        {
            var data = new List<HotelDto>();
            List<HotelData> hotelData;

            using (var db = new TravelContext())
            {
                hotelData = db.Hotels.Where(x => !x.IsDeleted).ToList();
            }

            if (hotelData.Count <= 0) return data;
            foreach (var item in hotelData)
            {
                data.Add(new HotelDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Description = item.Description,
                    DestinationId = item.DestinationId,
                    PricePerNight = item.PricePerNight,
                    Rating = item.Rating,
                    ImageUrl = item.ImageUrl
                });
            }

            return data;
        }

        protected HotelDto? GetHotelByIdActionExecution(int id)
        {
            HotelData? hotelData;
            using (var db = new TravelContext())
            {
                hotelData = db.Hotels.FirstOrDefault(x =>
                    x.Id == id && !x.IsDeleted);
            }

            if (hotelData == null) return null;
            return new HotelDto
            {
                Id = hotelData.Id,
                Name = hotelData.Name,
                Description = hotelData.Description,
                DestinationId = hotelData.DestinationId,
                PricePerNight = hotelData.PricePerNight,
                Rating = hotelData.Rating,
                ImageUrl = hotelData.ImageUrl
            };
        }

        protected ActionResponce CreateHotelActionExecution(HotelDto data)
        {
            using (var db = new TravelContext())
            {
                var hotelData = new HotelData
                {
                    Name = data.Name,
                    Description = data.Description,
                    DestinationId = data.DestinationId,
                    PricePerNight = data.PricePerNight,
                    Rating = data.Rating,
                    ImageUrl = data.ImageUrl,
                    CreatedAt = DateTime.UtcNow
                };
                db.Hotels.Add(hotelData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Hotel created successfully."
            };
        }

        protected ActionResponce UpdateHotelActionExecution(HotelDto data)
        {
            var localData = GetHotelByIdInternal(data.Id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Hotel not found."
                };
            }

            localData.Name = data.Name;
            localData.Description = data.Description;
            localData.DestinationId = data.DestinationId;
            localData.PricePerNight = data.PricePerNight;
            localData.Rating = data.Rating;
            localData.ImageUrl = data.ImageUrl;
            localData.UpdatedAt = DateTime.UtcNow;

            using (var db = new TravelContext())
            {
                db.Hotels.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Hotel updated successfully."
            };
        }

        protected ActionResponce DeleteHotelActionExecution(int id)
        {
            var localData = GetHotelByIdInternal(id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Hotel not found."
                };
            }

            localData.IsDeleted = true;

            using (var db = new TravelContext())
            {
                db.Hotels.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Hotel deleted."
            };
        }

        private HotelData? GetHotelByIdInternal(int id)
        {
            HotelData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Hotels.FirstOrDefault(x => x.Id == id);
            }

            return localData;
        }
    }
}
