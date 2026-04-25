using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.Destination;
using TravelBackend.Domain.Models.Destination;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Core
{
    public class DestinationActions
    {
        protected DestinationActions()
        {
        }

        protected List<DestinationDto> GetAllDestinationsActionExecution()
        {
            var data = new List<DestinationDto>();
            List<DestinationData> destinationData;

            using (var db = new TravelContext())
            {
                destinationData = db.Destinations.Where(x => !x.IsDeleted).ToList();
            }

            if (destinationData.Count <= 0) return data;
            foreach (var item in destinationData)
            {
                data.Add(new DestinationDto
                {
                    Id = item.Id,
                    Name = item.Name,
                    Country = item.Country,
                    Description = item.Description,
                    ImageUrl = item.ImageUrl
                });
            }

            return data;
        }

        protected DestinationDto? GetDestinationByIdActionExecution(int id)
        {
            DestinationData? destinationData;
            using (var db = new TravelContext())
            {
                destinationData = db.Destinations.FirstOrDefault(x =>
                    x.Id == id && !x.IsDeleted);
            }

            if (destinationData == null) return null;
            var data = new DestinationDto
            {
                Id = destinationData.Id,
                Name = destinationData.Name,
                Country = destinationData.Country,
                Description = destinationData.Description,
                ImageUrl = destinationData.ImageUrl
            };
            return data;
        }

        protected ActionResponce CreateDestinationActionExecution(DestinationDto data)
        {
            var status = ValidateDestinationName(data);
            if (!status.IsSuccess)
            {
                return status;
            }

            using (var db = new TravelContext())
            {
                var destinationData = new DestinationData
                {
                    Name = data.Name,
                    Country = data.Country,
                    Description = data.Description,
                    ImageUrl = data.ImageUrl,
                    CreatedAt = DateTime.Now
                };
                db.Destinations.Add(destinationData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Destination created successfully."
            };
        }

        protected ActionResponce UpdateDestinationActionExecution(DestinationDto data)
        {
            var localData = GetDestinationByIdInternal(data.Id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Destination not found."
                };
            }

            localData.Name = data.Name;
            localData.Country = data.Country;
            localData.Description = data.Description;
            localData.ImageUrl = data.ImageUrl;
            localData.UpdatedAt = DateTime.Now;

            using (var db = new TravelContext())
            {
                db.Destinations.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Destination updated successfully."
            };
        }

        protected ActionResponce DeleteDestinationActionExecution(int id)
        {
            var localData = GetDestinationByIdInternal(id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Destination not found."
                };
            }

            localData.IsDeleted = true;

            using (var db = new TravelContext())
            {
                db.Destinations.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Destination deleted."
            };
        }

        private DestinationData? GetDestinationByIdInternal(int id)
        {
            DestinationData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Destinations.FirstOrDefault(x => x.Id == id);
            }

            return localData;
        }

        private ActionResponce ValidateDestinationName(DestinationDto data)
        {
            DestinationData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Destinations.FirstOrDefault(x =>
                    x.Name.ToLower() == data.Name.ToLower() &&
                    x.Country.ToLower() == data.Country.ToLower() &&
                    !x.IsDeleted);
            }

            if (localData != null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "A destination with the same name already exists."
                };
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Destination name is valid."
            };
        }
    }
}
