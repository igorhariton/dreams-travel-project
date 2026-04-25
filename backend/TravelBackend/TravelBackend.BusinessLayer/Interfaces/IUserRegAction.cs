using TravelBackend.Domain.Models.Responces;
using TravelBackend.Domain.Models.User;

namespace TravelBackend.BusinessLayer.Interfaces
{
    public interface IUserRegAction
    {
        public ActionResponce UserRegDataValidation(UserRegisterDto uReg);
    }
}
