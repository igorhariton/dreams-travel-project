using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.Favorite;
using TravelBackend.Domain.Models.Favorite;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Core
{
    public class FavoriteActions
    {
        protected FavoriteActions()
        {
        }

        protected List<FavoriteDto> GetAllFavoritesActionExecution()
        {
            var data = new List<FavoriteDto>();
            List<FavoriteData> favoriteData;

            using (var db = new TravelContext())
            {
                favoriteData = db.Favorites.Where(x => !x.IsDeleted).ToList();
            }

            if (favoriteData.Count <= 0) return data;
            foreach (var item in favoriteData)
            {
                data.Add(new FavoriteDto
                {
                    Id = item.Id,
                    UserId = item.UserId,
                    ListingType = item.ListingType,
                    ListingId = item.ListingId
                });
            }

            return data;
        }

        protected FavoriteDto? GetFavoriteByIdActionExecution(int id)
        {
            FavoriteData? favoriteData;
            using (var db = new TravelContext())
            {
                favoriteData = db.Favorites.FirstOrDefault(x =>
                    x.Id == id && !x.IsDeleted);
            }

            if (favoriteData == null) return null;
            return new FavoriteDto
            {
                Id = favoriteData.Id,
                UserId = favoriteData.UserId,
                ListingType = favoriteData.ListingType,
                ListingId = favoriteData.ListingId
            };
        }

        protected ActionResponce CreateFavoriteActionExecution(FavoriteDto data)
        {
            var status = ValidateFavorite(data);
            if (!status.IsSuccess)
            {
                return status;
            }

            using (var db = new TravelContext())
            {
                var favoriteData = new FavoriteData
                {
                    UserId = data.UserId,
                    ListingType = data.ListingType,
                    ListingId = data.ListingId,
                    CreatedAt = DateTime.UtcNow
                };
                db.Favorites.Add(favoriteData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Favorite created successfully."
            };
        }

        protected ActionResponce DeleteFavoriteActionExecution(int id)
        {
            var localData = GetFavoriteByIdInternal(id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Favorite not found."
                };
            }

            localData.IsDeleted = true;

            using (var db = new TravelContext())
            {
                db.Favorites.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Favorite deleted."
            };
        }

        private FavoriteData? GetFavoriteByIdInternal(int id)
        {
            FavoriteData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Favorites.FirstOrDefault(x => x.Id == id);
            }

            return localData;
        }

        private ActionResponce ValidateFavorite(FavoriteDto data)
        {
            FavoriteData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Favorites.FirstOrDefault(x =>
                    x.UserId == data.UserId &&
                    x.ListingType == data.ListingType &&
                    x.ListingId == data.ListingId &&
                    !x.IsDeleted);
            }

            if (localData != null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Favorite already exists."
                };
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Favorite is valid."
            };
        }
    }
}
